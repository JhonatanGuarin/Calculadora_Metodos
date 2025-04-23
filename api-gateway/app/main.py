from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.router import router

app = FastAPI(title="Métodos Numéricos API Gateway")

# Configurar CORS para permitir solicitudes desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir las rutas
app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Bienvenido a la API de Métodos Numéricos"}