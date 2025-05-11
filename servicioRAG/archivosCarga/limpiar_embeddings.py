from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
mongo = MongoClient(os.getenv("MONGO_URI"))
db = mongo["miBaseDeDatos"]

# Elimina todos los documentos
db["xApiEmbeddings"].delete_many({})
print("🧹 Colección 'xApiEmbeddings' vaciada con éxito.")
