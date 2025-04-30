from pydantic import BaseModel
from typing import Optional, List

class SimpsonRequest(BaseModel):
    equation: str  # La función a integrar en formato string, ej: "x**2 + 1"
    a: float  # Límite inferior de integración
    b: float  # Límite superior de integración
    n: int = 10  # Número de subintervalos (debe ser par)

class SubintervalResult(BaseModel):
    index: int
    x_value: float
    y_value: float
    coefficient: int  # 1, 2 o 4 según la posición en la fórmula de Simpson
    weighted_value: float

class SimpsonResponse(BaseModel):
    integral: Optional[float] = None
    subintervals: List[SubintervalResult] = []
    success: bool = False
    message: str