# migrate_cursos.py
import os
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI)
db       = client["miBaseDeDatos"]
usuarios = db["usuarios"]
cursos   = db["cursos"]

# Recorre todos los usuarios que tengan cursos
for u in usuarios.find({ "cursos": { "$exists": True, "$ne": [] } }):
    user_id = u["_id"]
    rol     = u.get("rol")
    subrol  = u.get("subrol", "")
    for c in u["cursos"]:
        # Si ya existe ese curso en la colección, saltamos
        if cursos.find_one({"_id": c["_id"]}):
            continue

        nuevo = {
            "_id":        c["_id"],                # mantenemos el mismo ObjectId
            "userId":     user_id,
            "tema":       c.get("tema"),
            "formato":    c.get("formato"),
            "necesidades":c.get("necesidades"),
            "contenido":  c.get("contenido"),
            "videoId":    c.get("videoId"),
            "createdAt":  c.get("createdAt", datetime.utcnow()),
            "rol":        rol,
            "subrol":     subrol,
            "popularity": c.get("popularity", 0)
        }
        cursos.insert_one(nuevo)
        print(f"→ Migrado curso {c['_id']} de usuario {user_id}")

print("✅ Migración completada.")
