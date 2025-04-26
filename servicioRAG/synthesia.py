# synthesia.py
import os
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

router = APIRouter()

class Clip(BaseModel):
    script: list[dict]    # [{"type":"text","text":"...","lang":"es-ES"}]
    avatar_id: str

class VideoRequest(BaseModel):
    clips: list[Clip]
    title: str = "Curso Synthesia"
    description: str = ""
    visibility: str = "private"  # "private" o "public"
    test: bool = True

class VideoResponse(BaseModel):
    videoUrl: str

@router.post("/generate-video", response_model=VideoResponse)
async def generate_video(req: VideoRequest):
    api_key = os.getenv("SYNTHESIA_API_KEY")
    if not api_key:
        raise HTTPException(500, "Synthesia API key no configurada")

    payload = {
        "input": [
            {
                "script":    req.clips[0].script,
                "avatar_id": req.clips[0].avatar_id
            }
        ],
        "test":        req.test,
        "title":       req.title,
        "description": req.description,
        "visibility":  req.visibility
    }
    headers = {
        "accept":        "application/json",
        "content-type":  "application/json",
        "Authorization": api_key
    }

    async with httpx.AsyncClient(timeout=300) as client:
        r = await client.post("https://api.synthesia.io/v2/videos", json=payload, headers=headers)
        if r.status_code not in (200, 201, 202):
            raise HTTPException(r.status_code, detail=r.text)

        video_id = r.json().get("id")
        if not video_id:
            raise HTTPException(500, "No se devolvió video ID")

        status_url = f"https://api.synthesia.io/v2/videos/{video_id}"
        # Polling hasta 30 ciclos (5s intervalo → ~150s total)
        for _ in range(30):
            st = (await client.get(status_url, headers=headers)).json()
            if st.get("status") == "completed":
                return VideoResponse(videoUrl=st["download"])
            if st.get("status") == "failed":
                raise HTTPException(500, "Synthesia falló generando el vídeo")
            await asyncio.sleep(5)

        raise HTTPException(504, "Timeout esperando vídeo de Synthesia")
