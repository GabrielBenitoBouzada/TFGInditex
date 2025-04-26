# rag_query.py
import os
from pymongo import MongoClient
from dotenv import load_dotenv
from openai import OpenAI

# Cargar entorno
load_dotenv()
mongo_uri = os.getenv("MONGO_URI")
openai_key = os.getenv("OPENAI_API_KEY")

# Conexión Mongo
client = MongoClient(mongo_uri)
db = client["miBaseDeDatos"]
collection = db["xApis"]
print("✅ Conectado correctamente a MongoDB RAG (colección xApis)")

def generar_respuesta(pregunta):
    spanish_fragments = []
    for doc in collection.find({}):
        def extract_es_fields(obj):
            result = []
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if "__es" in key and isinstance(value, str):
                        result.append(value)
                    elif isinstance(value, (dict, list)):
                        result.extend(extract_es_fields(value))
            elif isinstance(obj, list):
                for item in obj:
                    result.extend(extract_es_fields(item))
            return result

        spanish_fragments.extend(extract_es_fields(doc))

    if not spanish_fragments:
        print("❌ No se encontraron fragmentos 'text__es' en la base de datos.")
        return "No se encontraron fragmentos en la base de datos."

    print(f"✅ Se encontraron {len(spanish_fragments)} fragmentos text__es")

    # Recortar contexto para evitar superar tokens
    context = "\n".join(spanish_fragments[:80])  # Ajusta según necesidad

    prompt = f"""
Utiliza el siguiente contenido formativo extraído de la base de datos para redactar un curso extenso y profesional sobre el tema: \"{pregunta}\".

{context}

El curso debe:
- Tener títulos visibles con <h2> y subtítulos con <h3>
- Desarrollar el contenido con muchos <p> párrafos informativos
- Estar escrito como documento didáctico completo, sin promesas (no digas \"aprenderás\")
- Evitar generalidades y explicar cada concepto con profundidad
- Ser útil para aprender de forma directa
"""

    openai = OpenAI(api_key=openai_key)

    try:
        completion = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Eres un experto en formación educativa corporativa."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=3000  # puedes ajustar a 3500 si el contexto lo permite
        )
        return completion.choices[0].message.content.strip()

    except Exception as e:
        print(f"❌ Error al generar el curso: {e}")
        return "Error generando el curso."

# Para pruebas manuales
if __name__ == "__main__":
    pregunta = os.environ.get("QUESTION", "Genera un curso completo sobre mobiliario")
    respuesta = generar_respuesta(pregunta)
    print(respuesta)
