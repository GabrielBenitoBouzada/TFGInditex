from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()
mongo = MongoClient(os.getenv("MONGO_URI"))
db = mongo["miBaseDeDatos"]
cursos = db["cursos"]

# Establece idioma por defecto como 'es' si no lo tienen
resultado = cursos.update_many(
    {"idioma": {"$exists": False}},
    {"$set": {"idioma": "es"}}
)

print(f"✅ Cursos actualizados con idioma 'es': {resultado.modified_count}")
