import os
import re
from dotenv import load_dotenv
from pymongo import MongoClient
from openai import OpenAI
from tqdm import tqdm

# Cargar variables de entorno
load_dotenv()
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")

# Inicializar clientes
openai = OpenAI(api_key=OPENAI_KEY)
mongo = MongoClient(MONGO_URI)
db = mongo["miBaseDeDatos"]
xapis = db["xApis"]
embeddings_col = db["xApiEmbeddings"]

# Idiomas soportados
idiomas = ["es", "fr", "it", "en", "de"]

# Función para extraer texto por idioma desde documentos anidados
def extraer_texto(doc, idioma):
    resultado = []
    if isinstance(doc, dict):
        for k, v in doc.items():
            if isinstance(k, str) and k == f"text__{idioma}" and isinstance(v, str):
                resultado.append(v.strip())
            else:
                resultado.extend(extraer_texto(v, idioma))
    elif isinstance(doc, list):
        for item in doc:
            resultado.extend(extraer_texto(item, idioma))
    return resultado

# Limpiar espacios y saltos de línea excesivos
def limpiar_texto(texto):
    texto = re.sub(r"\s+", " ", texto)
    return texto.strip()

# 🔒 Obtener combinaciones ya procesadas para evitar repeticiones
ya_insertados = embeddings_col.aggregate([
    {"$group": {"_id": {"origen": "$origen", "idioma": "$idioma"}}}
])
procesados = set((d["_id"]["origen"], d["_id"]["idioma"]) for d in ya_insertados)

# 🧠 Procesar nuevos documentos xAPI
print("🔍 Procesando documentos xAPI...")
for doc in tqdm(xapis.find()):
    origen = doc.get("origen", "desconocido")

    for idioma in idiomas:
        if (origen, idioma) in procesados:
            print(f"⚠️  Ya existe embedding para '{origen}' [{idioma}], saltando.")
            continue

        textos = extraer_texto(doc, idioma)
        if not textos:
            continue

        combinado = limpiar_texto("\n".join(textos))
        if not combinado:
            continue

        # Limitar texto a 22.000 caracteres ≈ 7.500 tokens para evitar error 8192
        if len(combinado) > 22000:
            combinado = combinado[:22000]

        try:
            emb = openai.embeddings.create(
                model="text-embedding-3-small",
                input=combinado
            )
            vector = emb.data[0].embedding
            embeddings_col.insert_one({
                "origen": origen,
                "idioma": idioma,
                "fragmento": combinado,
                "embedding": vector
            })
            print(f"✅ Embedding generado para '{origen}' [{idioma}]")
        except Exception as e:
            print(f"❌ Error en '{origen}' [{idioma}]: {e}")
