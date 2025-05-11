from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv
import os
import httpx

load_dotenv()
SYNTHESIA_KEY = os.getenv("SYNTHESIA_API_KEY")

router = APIRouter()

@router.get("/synthesia/status/{video_id}")
async def synthesia_status(video_id: str):
    if not SYNTHESIA_KEY:
        raise HTTPException(500, "Synthesia API key no configurada")

    headers = {"Authorization": SYNTHESIA_KEY}
    url = f"https://api.synthesia.io/v2/videos/{video_id}"

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, headers=headers)

    if r.status_code != 200:
        raise HTTPException(r.status_code, r.text)

    data = r.json()
    status = data.get("status") or data.get("state")

    if status in ("completed", "complete"):
        video_url = data.get("download") or data.get("assets", {}).get("mp4")
        if not video_url:
            raise HTTPException(500, "URL de vídeo no encontrada")
        return {"status": "completed", "videoUrl": video_url}

    return {"status": status}
