from fastapi import APIRouter, Request, HTTPException
from pymongo import MongoClient
from bson import ObjectId
from openai import OpenAI
from dotenv import load_dotenv
import os
import base64
import httpx
import asyncio
import re

from utils import cosine_similarity, strip_html, extract_first_h2, detectar_tamano_letra

load_dotenv()
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
SYNTHESIA_KEY = os.getenv("SYNTHESIA_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")

openai = OpenAI(api_key=OPENAI_KEY)
mongo = MongoClient(MONGO_URI)
db = mongo["miBaseDeDatos"]
usuarios = db["usuarios"]
xapi_embeddings = db["xApiEmbeddings"]

router = APIRouter()

@router.post("/generate-course")
async def generate_course(req: Request):
    body = await req.json()
    email = body.get("email")
    tema = body.get("tema", "").strip()
    subtema = body.get("subtema", "").strip().lower()
    formato = body.get("formato", "texto").lower()

    user = usuarios.find_one({"email": email})
    if not user:
        raise HTTPException(404, "Usuario no encontrado")

    idioma = user.get("idiomaPredeterminado", "es")
    accesibilidad = user.get("preferenciasAccesibilidad", {})
    lenguaje_sencillo = accesibilidad.get("lenguajeSencillo", False)
    tamano_letra = accesibilidad.get("tamanoLetra", "normal")

    try:
        emb_tema = openai.embeddings.create(
            model="text-embedding-3-small", input=tema
        ).data[0].embedding
    except Exception as e:
        raise HTTPException(500, f"Error al generar embedding del tema: {e}")

    docs = list(xapi_embeddings.find({"idioma": idioma}))
    if not docs:
        raise HTTPException(404, f"No hay documentos en idioma {idioma}")

    mejor = max(docs, key=lambda d: cosine_similarity(emb_tema, d["embedding"]))
    contexto = mejor["fragmento"]
    print("\n\U0001f9e0 Origen seleccionado:", mejor.get("origen"))
    print("\U0001f4da Fragmento:\n", contexto[:500], "\n---")

    max_toks = 800 if formato == "video" else (2000 if formato == "audio" else 4000)
    foco = f"\n➡️ El curso se centra en «{subtema}»." if subtema else ""

    prompt = f"""
Eres un experto en formación interna. Redacta directamente un curso completo, claro y detallado sobre el tema: "{tema}".

Contenido formativo disponible en idioma {idioma}:
{contexto}

➡️ Usa etiquetas <h2> para títulos, <h3> para subtítulos y <p> para párrafos informativos.
➡️ Siemrpe que se mencione la palabra Inditex en el curso, trata de mencionarla y que tenga significancia
➡️ Desarrolla el contenido de forma didáctica, sin usar frases como 'en este curso aprenderás'. No uses futuro ni instrucciones.
➡️ Explica de forma directa y clara como si el curso ya estuviese escrito, no lo anuncies.
➡️ Incluye mínimo 3 párrafos por sección, con ejemplos reales si es posible.{foco}
➡️ Cierra con un párrafo final que resuma y concluya el contenido de forma práctica.
"""

    if lenguaje_sencillo:
        prompt += "\n➡️ Adapta el lenguaje para que sea muy sencillo y fácil de comprender."

    if tamano_letra != "normal":
        prompt += f"\n➡️ El usuario necesita letra de tamaño «{tamano_letra}»."

    try:
        resp = openai.chat.completions.create(
            model="gpt-4-1106-preview",
            messages=[
                {"role": "system", "content": "Eres un generador de cursos claros, ya redactados, sin lenguaje futuro."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_toks,
            temperature=0.7
        )
        contenido = resp.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(500, f"OpenAI error: {e}")

    estilo_html = detectar_tamano_letra(tamano_letra)
    contenido_final = f"{estilo_html}\n{contenido}"
    titulo = extract_first_h2(contenido)

    if formato == "audio":
        speech = openai.audio.speech.create(model="tts-1", voice="nova", input=contenido)
        audio_b64 = base64.b64encode(speech.read()).decode("utf-8")
        return {
            "format": "audio",
            "cursoTexto": contenido_final,
            "audio": audio_b64,
            "tituloCurso": titulo
        }

    if formato == "video":
        texto_limpio = strip_html(strip_html(contenido))
        texto_sin_markdown = strip_markdown(texto_limpio)[:3000]
        print("\U0001f8be Texto limpio para Synthesia:", texto_sin_markdown[:400])
        video_id = await start_synthesia_job(texto_sin_markdown)
        video_url = await poll_until_video_ready(video_id)
        return {
            "format": "video",
            "cursoTexto": contenido_final,
            "videoUrl": video_url,
            "videoId": video_id,
            "tituloCurso": titulo
        }

    return {
        "format": "texto",
        "curso": contenido_final,
        "tituloCurso": titulo
    }

def strip_markdown(text: str) -> str:
    text = re.sub(r'#\s*', '', text)
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'[_`]', '', text)
    return text.strip()

async def start_synthesia_job(text: str) -> str:
    if not SYNTHESIA_KEY:
        raise HTTPException(500, "Synthesia API key no configurada")
    payload = {
        "input": [{"scriptText": text, "avatar": "anna_costume1_cameraA", "background": "green_screen"}],
        "test": True,
        "title": "Vídeo de curso",
        "description": "Generado por API",
        "visibility": "private",
        "aspectRatio": "16:9",
        "resolution": "720p"
    }
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "Authorization": SYNTHESIA_KEY
    }
    async with httpx.AsyncClient(timeout=300) as client:
        r = await client.post("https://api.synthesia.io/v2/videos", json=payload, headers=headers)
    if r.status_code not in (200, 201, 202):
        raise HTTPException(r.status_code, f"Synthesia error: {r.text}")
    vid = r.json().get("id")
    if not vid:
        raise HTTPException(500, "No se recibió video ID")
    return vid

async def poll_until_video_ready(video_id: str) -> str:
    headers = {"Authorization": SYNTHESIA_KEY}
    url = f"https://api.synthesia.io/v2/videos/{video_id}"
    max_retries = 60
    for attempt in range(max_retries):
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url, headers=headers)
        if r.status_code != 200:
            raise HTTPException(r.status_code, r.text)
        data = r.json()
        state = data.get("status") or data.get("state")
        print(f"⏳ Esperando vídeo... Estado: {state}")
        if state in ("completed", "complete"):
            final_url = data.get("download") or data.get("assets", {}).get("mp4")
            if not final_url:
                raise HTTPException(500, "No se encontró la URL del vídeo generado")
            return final_url
        await asyncio.sleep(10)
    raise HTTPException(504, "El vídeo no se completó tras varios intentos")
