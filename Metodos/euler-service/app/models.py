from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union

class EulerRequest(BaseModel):
    equation: str  # La ecuación diferencial dy/dx = f(x,y)
    x0: float      # Valor inicial de x
    y0: float      # Valor inicial de y
    xf: float      # Valor final de x
    h: float       # Tamaño del paso
    max_steps: int = 1000  # Número máximo de pasos

class IteracionEuler(BaseModel):
    paso: int
    x: float
    y: float
    dy_dx: float   # Valor de la derivada en el punto (x,y)

class EulerResponse(BaseModel):
    solucion: List[IteracionEuler]
    mensaje: str