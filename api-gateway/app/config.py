from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    punto_fijo_service_url: str
    biseccion_service_url: str
    newton_raphson_service_url: str
    secante_service_url: str
    jacobi_service_url: str
    gauss_seidel_service_url: str
    trapecio_service_url: str
    simpson_service_url: str
    romberg_service_url: str
    broyden_service_url: str
    euler_service_url: str  # Añadido para el servicio de Euler

    class Config:
        env_file = ".env"

settings = Settings()