from pymongo import MongoClient

# Conexión
cliente = MongoClient("mongodb+srv://gbenitoboinf:gbenito37@cluster0.1pr0kk9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = cliente["miBaseDeDatos"]
usuarios = db["usuarios"]

# Actualizar todos los usuarios
resultado = usuarios.update_many(
    {},  # todos los documentos
    {
        "$set": {
            "idiomaPredeterminado": "es",
            "preferenciasAccesibilidad": {
                "tamanoLetra": "mediano",
                "contrasteAlto": False,
                "lenguajeSencillo": False
            }
        }
    }
)

print(f"✅ {resultado.modified_count} usuarios actualizados con preferencias por defecto.")
