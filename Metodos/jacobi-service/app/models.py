from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class JacobiRequest(BaseModel):
    A: List[List[float]] = Field(..., description="Matriz de coeficientes")
    b: List[float] = Field(..., description="Vector de términos independientes")
    initial_guess: Optional[List[float]] = Field(None, description="Aproximación inicial (opcional)")
    max_iterations: int = Field(100, description="Número máximo de iteraciones", ge=1)
    tolerance: float = Field(1e-6, description="Tolerancia para el criterio de convergencia", gt=0)

class JacobiResponse(BaseModel):
    solution: List[float] = Field(..., description="Vector solución del sistema")
    iterations: int = Field(..., description="Número de iteraciones realizadas")
    error: float = Field(..., description="Error en la última iteración")
    converged: bool = Field(..., description="Indica si el método convergió")
    warnings: Optional[List[str]] = Field(None, description="Advertencias sobre la convergencia")
    convergence_details: Optional[Dict[str, Any]] = Field(None, description="Detalles sobre la convergencia")