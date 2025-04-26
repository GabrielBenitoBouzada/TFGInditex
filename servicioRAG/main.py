# main.py
import os
import re
import base64
import asyncio

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
from openai import OpenAI
import httpx

# ─── CARGAR ENTORNO ────────────────────────────────────────────────
load_dotenv()
OPENAI_KEY    = os.getenv("OPENAI_API_KEY")
SYNTHESIA_KEY = os.getenv("SYNTHESIA_API_KEY")
MONGO_URI     = os.getenv("MONGO_URI")

# ─── INICIALIZAR APP y CLIENTES ────────────────────────────────────
app    = FastAPI()
openai = OpenAI(api_key=OPENAI_KEY)
mongo  = MongoClient(MONGO_URI)
db     = mongo["miBaseDeDatos"]
usuarios = db["usuarios"]
xapis    = db["xApis"]

# ─── CORS ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── LOGEO DE CONEXIÓN A MONGO ──────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    print("✅ Conectado correctamente a MongoDB Atlas.")

# ─── UTILIDADES ────────────────────────────────────────────────────
def strip_html(html: str) -> str:
    text = re.sub(r"<[^>]+>", "", html)
    return re.sub(r"\s{2,}", " ", text).strip()

def extract_fragments(doc, idioma: str) -> list[str]:
    results = []
    if isinstance(doc, dict):
        for k, v in doc.items():
            if k == f"text__{idioma}" and isinstance(v, str):
                results.append(v)
            elif isinstance(v, (dict, list)):
                results += extract_fragments(v, idioma)
    elif isinstance(doc, list):
        for item in doc:
            results += extract_fragments(item, idioma)
    return results

# ─── SYNTHESIA: CREAR JOB ───────────────────────────────────────────
async def start_synthesia_job(text: str) -> str:
    if not SYNTHESIA_KEY:
        raise HTTPException(500, "Synthesia API key no configurada")
    payload = {
        "input": [{"scriptText": text, "avatar": "anna_costume1_cameraA", "background": "green_screen"}],
        "test": True,
        "title": "Píldora de conocimiento",
        "description": "Resumen breve generado",
        "visibility": "private",
        "aspectRatio": "16:9",
        "resolution": "720p"
    }
    headers = {
        "accept":       "application/json",
        "content-type": "application/json",
        "Authorization": SYNTHESIA_KEY
    }
    async with httpx.AsyncClient(timeout=300) as client:
        r = await client.post("https://api.synthesia.io/v2/videos", json=payload, headers=headers)
    if r.status_code not in (200,201,202):
        raise HTTPException(r.status_code, f"Synthesia error: {r.text}")
    vid = r.json().get("id")
    if not vid:
        raise HTTPException(500, "No se recibió video ID")
    return vid

@app.get("/synthesia/status/{video_id}")
async def synthesia_status(video_id: str):
    if not SYNTHESIA_KEY:
        raise HTTPException(500, "Synthesia API key no configurada")
    headers = {"Authorization": SYNTHESIA_KEY}
    status_url = f"https://api.synthesia.io/v2/videos/{video_id}"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(status_url, headers=headers)
    if r.status_code != 200:
        raise HTTPException(r.status_code, r.text)
    st = r.json()
    state = st.get("status") or st.get("state")
    if state in ("completed","complete"):
        url = st.get("download") or st.get("assets",{}).get("mp4")
        if not url:
            raise HTTPException(500, "URL de vídeo no encontrada")
        return {"status":"completed","videoUrl":url}
    return {"status":state}

# ─── AUTENTICACIÓN y GENERACIÓN ────────────────────────────────────
@app.post("/login")
async def login(req: Request):
    data = await req.json()
    u = usuarios.find_one({"email":data.get("email"),"password":data.get("password")})
    if not u:
        raise HTTPException(401,"Credenciales incorrectas")
    return {"message":"Login correcto","email":u["email"],"rol":u.get("rol"),"nombre":u.get("nombre")}

@app.post("/generate-course")
async def generate_course(req: Request):
    body        = await req.json()
    email       = body.get("email")
    tema        = body.get("tema","").strip()
    subtema     = body.get("subtema","").strip().lower()
    necesidades = body.get("necesidades","").strip()
    formato     = body.get("formato","texto").lower()
    idioma      = body.get("idioma","es").lower()

    # 1️⃣ Validar usuario
    user = usuarios.find_one({"email":email})
    if not user:
        raise HTTPException(404,"Usuario no encontrado")

    # 2️⃣ Extraer fragments según el tema dinámico
    frags = []
    docs = xapis.find({"origen":{"$regex":tema,"$options":"i"}})
    for d in docs:
        frags += extract_fragments(d,idioma)
    if subtema:
        filt = [f for f in frags if subtema in f.lower()]
        if filt: frags = filt
    context = "\n".join(frags[:50])

    # 3️⃣ Definir max_tokens: **Vídeo reducido a 400**
    if formato=="video":
        max_toks = 400
    elif formato=="audio":
        max_toks = 1500
    else:
        max_toks = 4000

    # 4️⃣ Construir prompt
    foco = f"\n➡️ Céntrate en «{subtema}»." if subtema else ""
    video_directive = ""
    if formato=="video":
        video_directive = (
            "\n➡️ FORMATO VÍDEO: crea una píldora de conocimiento en 2-3 frases "
            "sólo con datos clave del contexto."
        )

    prompt = f"""
Eres un experto en formación técnica. Redacta un curso sobre "{tema}".
Necesidades: "{necesidades}".
Contexto interno (en {idioma}):
{context}

➡️ Usa <h2> para títulos, <h3> para subtítulos y <p> para párrafos descriptivos.
➡️ Cada sección debe tener al menos 3 párrafos detallados con ejemplos y datos del contexto.
➡️ Evita futuro, promesas o “aprenderás”.
{foco}{video_directive}
"""

    # 5️⃣ Llamada a OpenAI
    try:
        resp = openai.chat.completions.create(
            model="gpt-4-1106-preview",
            messages=[
                {"role":"system","content":"Generador de cursos corporativos."},
                {"role":"user",  "content":prompt}
            ],
            max_tokens=max_toks,
            temperature=0.7
        )
    except Exception as e:
        raise HTTPException(500,f"OpenAI error: {e}")
    contenido = resp.choices[0].message.content.strip()

    # 6a) AUDIO
    if formato=="audio":
        speech    = openai.audio.speech.create(model="tts-1",voice="nova",input=contenido)
        audio_b64 = base64.b64encode(speech.read()).decode("utf-8")
        return {"format":"audio","cursoTexto":contenido,"audio":audio_b64}

    # 6b) VÍDEO
    if formato=="video":
        texto_plano = strip_html(contenido)[:3000]
        vid = await start_synthesia_job(texto_plano)
        return {"format":"video","cursoTexto":contenido,"videoId":vid}

    # 6c) TEXTO
    return {"format":"texto","curso":contenido}

@app.post("/guardar-curso")
async def guardar_curso(req: Request):
    data  = await req.json()
    email = data.get("email"); curso = data.get("curso")
    if not email or not curso:
        raise HTTPException(400,"Faltan parámetros")
    curso["_id"]=ObjectId()
    res=usuarios.update_one({"email":email},{"$push":{"cursos":curso}})
    if res.modified_count==0:
        raise HTTPException(404,"Usuario no encontrado")
    return {"message":"Curso guardado correctamente"}

@app.get("/cursos/{email}")
async def obtener_cursos(email: str):
    u = usuarios.find_one({"email":email})
    if not u:
        raise HTTPException(404,"Usuario no encontrado")
    cs = u.get("cursos",[])
    for c in cs: c["_id"]=str(c["_id"])
    return {"cursos":cs}

@app.get("/cursos/{email}/{curso_id}")
async def obtener_curso(email: str,curso_id: str):
    u = usuarios.find_one({"email":email})
    if not u:
        raise HTTPException(404,"Usuario no encontrado")
    for c in u.get("cursos",[]):
        if str(c["_id"])==curso_id:
            c["_id"]=curso_id
            return c
    raise HTTPException(404,"Curso no encontrado")
