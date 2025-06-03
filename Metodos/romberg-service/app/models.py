from pydantic import BaseModel
from typing import Optional, List, Dict

class RombergRequest(BaseModel):
    equation: str  # La función a integrar en formato string, ej: "x**2 + 1"
    a: float  # Límite inferior de integración
    b: float  # Límite superior de integración
    n: int = 4  # Número de iteraciones (niveles) para el método de Romberg

class RombergTableEntry(BaseModel):
    i: int  # Índice de fila
    j: int  # Índice de columna
    value: float  # Valor en la tabla de Romberg

class RombergResponse(BaseModel):
    integral: Optional[float] = None
    table: List[RombergTableEntry] = []
    success: bool = False
    message: str