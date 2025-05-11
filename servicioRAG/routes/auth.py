from fastapi import APIRouter, Request, HTTPException
from db import usuarios

router = APIRouter()

@router.post("/login")
async def login(req: Request):
    data = await req.json()
    u = usuarios.find_one({"email": data.get("email"), "password": data.get("password")})
    if not u:
        raise HTTPException(401, "Credenciales incorrectas")
    return {
        "message": "Login correcto",
        "email": u["email"],
        "rol": u.get("rol"),
        "subrol": u.get("subrol"),
        "nombre": u.get("nombre"),
        "idioma": u.get("idiomaPredeterminado", "es"),
        "preferenciasAccesibilidad": u.get("preferenciasAccesibilidad", {})
    }

@router.post("/actualizar-perfil")
async def actualizar_perfil(request: Request):
    data = await request.json()
    email = data.get("email")
    idioma = data.get("idiomaPredeterminado")
    accesibilidad = data.get("preferenciasAccesibilidad", {})

    if "contrasteAlto" in accesibilidad:
        accesibilidad["altoContraste"] = accesibilidad.pop("contrasteAlto")

    result = usuarios.update_one(
        {"email": email},
        {
            "$set": {
                "idiomaPredeterminado": idioma,
                "preferenciasAccesibilidad": accesibilidad
            }
        }
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Usuario no encontrado")
    return {"message": "Perfil actualizado"}

@router.get("/usuarios/{email}")
async def obtener_usuario(email: str):
    user = usuarios.find_one({"email": email})
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    return {
        "email": user.get("email"),
        "nombre": user.get("nombre"),
        "rol": user.get("rol"),
        "subrol": user.get("subrol"),
        "idioma": user.get("idiomaPredeterminado", "es"),
        "preferenciasAccesibilidad": user.get("preferenciasAccesibilidad", {})
    }
