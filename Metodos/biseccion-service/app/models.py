from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union

class PotentialRoot(BaseModel):
    """Modelo para representar una raíz potencial"""
    intervalo_inferior: float
    intervalo_superior: float
    es_raiz_exacta: bool = False
    valor_aproximado: Optional[float] = None

class BiseccionRequest(BaseModel):
    equation: str
    a: float
    b: float
    tol: float = 1e-6
    max_iter: int = 100
    # Nuevo campo para seleccionar una raíz específica
    seleccionar_raiz: Optional[int] = None
    # Nuevo campo para forzar la búsqueda de múltiples raíces
    forzar_busqueda: bool = False

class IteracionBiseccion(BaseModel):
    iteracion: int
    punto_a: float
    punto_b: float
    punto_medio: float
    error_porcentual: Optional[float] = None

class BiseccionResponse(BaseModel):
    raiz: Optional[float] = None
    iteraciones: int = 0
    pasos: List[IteracionBiseccion] = []
    mensaje: str = ""
    # Nuevo campo para devolver múltiples raíces potenciales
    raices_potenciales: Optional[List[PotentialRoot]] = None