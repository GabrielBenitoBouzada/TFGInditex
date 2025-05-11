import os
import re
from dotenv import load_dotenv
from pymongo import MongoClient

# ─── Cargar variables del .env ──────────────────────────────────────
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise Exception("❌ MONGO_URI no definido en .env")

# ─── Conectar a MongoDB ─────────────────────────────────────────────
client = MongoClient(MONGO_URI)
db = client["miBaseDeDatos"]
cursos = db["cursos"]

# ─── Función para extraer primer <h2> ───────────────────────────────
def extract_first_h2(html: str) -> str:
    match = re.search(r"<h2[^>]*>(.*?)</h2>", html, re.IGNORECASE)
    return match.group(1).strip() if match else "Curso Formativo"

# ─── Buscar cursos sin tituloCurso o sin popularity ────────────────
pendientes = cursos.find({
    "$or": [
        { "tituloCurso": { "$exists": False } },
        { "popularity": { "$exists": False } }
    ]
})

# ─── Procesar y actualizar ─────────────────────────────────────────
actualizados = 0
for curso in pendientes:
    updates = {}
    if "tituloCurso" not in curso:
        contenido = curso.get("contenido", "")
        titulo = extract_first_h2(contenido)
        updates["tituloCurso"] = titulo
    if "popularity" not in curso:
        updates["popularity"] = 0
    if updates:
        cursos.update_one({"_id": curso["_id"]}, {"$set": updates})
        actualizados += 1
        print(f"✅ Curso actualizado: {curso.get('tema')}")

print(f"\n🎯 Migración completada. Total de cursos modificados: {actualizados}")
