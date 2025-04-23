from pydantic import BaseModel
from typing import Optional, List

class PuntoFijoRequest(BaseModel):
    equation: str  # La ecuación en formato string, ej: "x**2 - 4"
    g_function: str  # La función g(x) para la iteración, ej: "sqrt(4)"
    initial_x: float  # Valor inicial de x
    tolerance: float = 1e-6  # Tolerancia para la convergencia
    max_iterations: int = 100  # Número máximo de iteraciones

class IterationResult(BaseModel):
    iteration: int
    x_value: float
    error: float

class PuntoFijoResponse(BaseModel):
    root: Optional[float] = None
    iterations: List[IterationResult] = []
    converged: bool = False
    message: str