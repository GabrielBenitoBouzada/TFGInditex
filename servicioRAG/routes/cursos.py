from fastapi import APIRouter, Request, HTTPException
from db import usuarios, cursos
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
from openai import OpenAI
import os

router = APIRouter()

# Configura OpenAI (asegúrate de tener OPENAI_API_KEY en .env)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@router.post("/guardar-curso")
async def guardar_curso(req: Request):
    data = await req.json()
    email = data.get("email")
    curso = data.get("curso")

    if not email or not curso:
        raise HTTPException(400, "Faltan parámetros")

    if not curso.get("contenido"):
        raise HTTPException(400, "El curso no tiene contenido")

    user = usuarios.find_one({"email": email})
    if not user:
        raise HTTPException(404, "Usuario no encontrado")

    nuevo_curso = curso.copy()
    nuevo_curso.pop("_id", None)
    nuevo_curso["userId"] = user["_id"]
    nuevo_curso["rol"] = user.get("rol", "")
    nuevo_curso["subrol"] = user.get("subrol", "")
    nuevo_curso["idioma"] = user.get("idioma") or user.get("idiomaPredeterminado", "es")
    nuevo_curso["createdAt"] = datetime.utcnow()
    nuevo_curso["popularity"] = 0
    nuevo_curso["likes"] = []

    # ✅ Generar imagen con DALL·E 2 si no existe ya
    try:
        titulo = nuevo_curso.get("tituloCurso", nuevo_curso.get("tema", "curso"))
        prompt = f"Imagen educativa relacionada con el contenido del curso: {titulo}. Fondo limpio, formato cuadrado, estilo profesional corporativo."
        response = client.images.generate(
            model="dall-e-2",
            prompt=prompt,
            size="1024x1024",
            response_format="b64_json"
        )
        imagen_b64 = response.data[0].b64_json
        nuevo_curso["imagenCurso"] = f"data:image/png;base64,{imagen_b64}"
    except Exception as e:
        print(f"❌ Error al generar imagen: {e}")
        nuevo_curso["imagenCurso"] = ""  # o dejarlo sin definir

    cursos.insert_one(nuevo_curso)
    return {"message": "Curso guardado correctamente"}

@router.get("/cursos/{email}/{curso_id}")
async def obtener_curso(email: str, curso_id: str):
    curso = cursos.find_one({"_id": ObjectId(curso_id)})
    if not curso:
        raise HTTPException(404, "Curso no encontrado")
    curso["_id"] = str(curso["_id"])
    curso["userId"] = str(curso["userId"])
    return curso

@router.get("/cursos/{email}")
async def obtener_cursos(email: str):
    user = usuarios.find_one({"email": email})
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    resultados = cursos.find({"userId": user["_id"]})
    return {
        "cursos": [
            {**c, "_id": str(c["_id"]), "userId": str(c["userId"])}
            for c in resultados
        ]
    }

@router.get("/recommended-courses")
async def recommended_courses(email: str):
    user = usuarios.find_one({"email": email})
    if not user:
        raise HTTPException(404, "Usuario no encontrado")

    rol = user.get("rol")
    subrol = user.get("subrol", "")
    idioma = user.get("idioma") or user.get("idiomaPredeterminado", "es")
    user_id = user["_id"]

    cursos_cursor = cursos.find({
        "rol": rol,
        "subrol": subrol,
        "idioma": idioma,
        "userId": {"$ne": user_id}
    }).sort([
        ("popularity", -1),
        ("createdAt", -1)
    ]).limit(4)

    result = []
    for c in cursos_cursor:
        result.append({
            "_id": str(c["_id"]),
            "tema": c.get("tema"),
            "tituloCurso": c.get("tituloCurso", "Curso Formativo"),
            "formato": c.get("formato"),
            "popularity": c.get("popularity", 0),
            "likes": c.get("likes", []),
            "imagenCurso": c.get("imagenCurso", "")
        })

    return {"cursos": result}

class CursoLike(BaseModel):
    curso_id: str
    email: str

@router.post("/like-curso")
async def like_curso(curso: CursoLike):
    curso_obj = cursos.find_one({"_id": ObjectId(curso.curso_id)})
    if not curso_obj:
        raise HTTPException(404, "Curso no encontrado")
    if curso.email in curso_obj.get("likes", []):
        raise HTTPException(400, "Este usuario ya ha dado like")

    cursos.update_one(
        {"_id": ObjectId(curso.curso_id)},
        {
            "$inc": {"popularity": 1},
            "$push": {"likes": curso.email}
        }
    )
    return {"message": "Like registrado"}
