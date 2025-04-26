# api/endpoints.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from rag_query import generar_respuesta  # Reutilizamos tu lógica existente

router = APIRouter()

class Consulta(BaseModel):
    pregunta: str

@router.post("/generar-curso")
async def generar_curso(data: Consulta):
    try:
        respuesta = generar_respuesta(data.pregunta)
        return {"respuesta": respuesta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
