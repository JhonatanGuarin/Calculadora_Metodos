from pydantic import BaseModel, Field
from typing import Optional

class NewtonRaphsonRequest(BaseModel):
    equation: str = Field(..., description="Ecuación para encontrar raíces")
    x0: float = Field(..., description="Valor inicial para comenzar la iteración")
    tolerance: float = Field(1e-6, description="Tolerancia para el criterio de convergencia")
    max_iterations: int = Field(100, description="Número máximo de iteraciones")

class NewtonRaphsonResponse(BaseModel):
    root: Optional[float] = Field(None, description="Raíz encontrada")
    iterations: int = Field(..., description="Número de iteraciones realizadas")
    convergence: bool = Field(..., description="Indica si el método convergió")
    error: Optional[float] = Field(None, description="Error estimado en la solución")
    all_iterations: list = Field([], description="Lista de todas las iteraciones")
    message: str = Field("", description="Mensaje informativo sobre el resultado")