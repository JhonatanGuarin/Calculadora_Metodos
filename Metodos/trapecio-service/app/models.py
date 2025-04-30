from pydantic import BaseModel
from typing import Optional, List

class TrapecioRequest(BaseModel):
    equation: str  # La función a integrar en formato string, ej: "x**2 + 1"
    a: float  # Límite inferior de integración
    b: float  # Límite superior de integración
    n: int = 10  # Número de subintervalos (trapecios)

class SubintervalResult(BaseModel):
    index: int
    x_value: float
    y_value: float
    area: float

class TrapecioResponse(BaseModel):
    integral: Optional[float] = None
    subintervals: List[SubintervalResult] = []
    success: bool = False
    message: str