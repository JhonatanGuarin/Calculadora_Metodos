from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union

class BiseccionRequest(BaseModel):
    equation: str
    a: float
    b: float
    tol: float = 1e-6
    max_iter: int = 100

class IteracionBiseccion(BaseModel):
    iteracion: int
    punto_a: float
    punto_b: float
    punto_medio: float
    error_porcentual: Optional[float] = None

class BiseccionResponse(BaseModel):
    raiz: float
    iteraciones: int
    pasos: List[IteracionBiseccion]
    mensaje: str