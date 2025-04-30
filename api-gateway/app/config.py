from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    punto_fijo_service_url: str
    biseccion_service_url: str
    newton_raphson_service_url: str
    secante_service_url: str
    jacobi_service_url: str
    gauss_seidel_service_url: str
    trapecio_service_url: str  # Añadir esta línea
    # Aquí agregaremos más servicios a medida que los implementemos

    class Config:
        env_file = ".env"

settings = Settings()