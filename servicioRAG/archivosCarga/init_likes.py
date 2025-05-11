from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()
client = MongoClient(os.getenv("MONGO_URI"))
db = client["miBaseDeDatos"]
cursos = db["cursos"]

result = cursos.update_many(
    {"likes": {"$exists": False}},
    {"$set": {"likes": []}}
)

print(f"{result.modified_count} cursos actualizados con campo 'likes'")
