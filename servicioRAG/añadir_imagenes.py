import os
from pymongo import MongoClient
from openai import OpenAI
from dotenv import load_dotenv

# Cargar claves del entorno
load_dotenv()
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")

# Conectar con servicios
client = OpenAI(api_key=OPENAI_KEY)
mongo = MongoClient(MONGO_URI)
db = mongo["miBaseDeDatos"]
cursos = db["cursos"]

# Buscar cursos sin imagen o con URL temporal
cursos_sin_imagen = list(cursos.find({
    "$or": [
        {"imagenCurso": {"$exists": False}},
        {"imagenCurso": {"$regex": "^https://"}}
    ]
}))

print(f"🔎 Cursos a actualizar con imagen base64: {len(cursos_sin_imagen)}")
errores = []

# Generar imágenes e insertar en Mongo
for curso in cursos_sin_imagen:
    titulo = curso.get("tituloCurso", curso.get("tema", "Curso sin título"))
    prompt = f"Imagen corporativa educativa relacionada con: {titulo}. Fondo limpio y profesional. Formato cuadrado."

    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            response_format="b64_json"
        )
        imagen_b64 = response.data[0].b64_json
        imagen_data_url = f"data:image/png;base64,{imagen_b64}"

        cursos.update_one(
            {"_id": curso["_id"]},
            {"$set": {"imagenCurso": imagen_data_url}}
        )
        print(f"✅ Imagen añadida a: {titulo}")

    except Exception as e:
        errores.append((titulo, str(e)))
        print(f"❌ Error con '{titulo}': {e}")

# Resultado final
print(f"\n🟡 Finalizado con {len(errores)} errores.")
for titulo, error in errores:
    print(f" - {titulo}: {error}")
