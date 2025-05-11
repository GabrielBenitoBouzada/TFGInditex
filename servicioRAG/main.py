from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth import router as auth_router
from routes.generate_course import router as generate_router
from routes.cursos import router as cursos_router
from routes.video import router as video_router  # ✅ Nuevo import

from db import init_db

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(auth_router)
app.include_router(generate_router)
app.include_router(cursos_router)
app.include_router(video_router)  # ✅ Nuevo router
