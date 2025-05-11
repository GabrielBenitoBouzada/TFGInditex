# preload.py
import os, math
from pymongo import MongoClient
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
MONGO_URI    = os.getenv("MONGO_URI")
OPENAI_KEY   = os.getenv("OPENAI_API_KEY")

client = MongoClient(MONGO_URI)
db     = client["miBaseDeDatos"]
xapis  = db["xApis"]

openai = OpenAI(api_key=OPENAI_KEY)

# Ajusta este tamaño a tu gusto (aprox 500 tokens ≃ 2000 caracteres)
MAX_CHARS = 2000

def chunk_text(text: str):
    """Divide en trozos de MAX_CHARS sin cortar palabras."""
    parts = []
    start = 0
    while start < len(text):
        end = min(len(text), start + MAX_CHARS)
        # retrocede hasta un espacio
        if end < len(text):
            while end > start and text[end] != " ":
                end -= 1
        parts.append(text[start:end].strip())
        start = end
    return parts

def main():
    for doc in xapis.find({}):
        updates = []
        for lang in ["es","en","fr","it","de"]:
            key = f"text__{lang}"
            if key in doc:
                for chunk in chunk_text(doc[key]):
                    # calculamos embedding
                    resp = openai.embeddings.create(
                        model="text-embedding-ada-002",
                        input=chunk
                    )
                    vec = resp.data[0].embedding
                    updates.append({
                        "origen":   doc["origen"],
                        "idioma":   lang,
                        "fragmento": chunk,
                        "vector":   vec
                    })
        # guardamos _todos_ los chunks como documentos separados
        if updates:
            xapis.insert_many(updates)

if __name__=="__main__":
    main()
