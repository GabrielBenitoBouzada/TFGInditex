import os
from pymongo import MongoClient
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
SYNTHESIA_KEY = os.getenv("SYNTHESIA_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")

openai = OpenAI(api_key=OPENAI_KEY)
client = MongoClient(MONGO_URI)

db = client["miBaseDeDatos"]
usuarios = db["usuarios"]
xapi_embeddings = db["xApiEmbeddings"]
cursos = db["cursos"]

def init_db():
    print("✅ Conectado correctamente a MongoDB Atlas.")
