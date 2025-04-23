from pydantic import BaseModel
from typing import Optional, List

class SecantRequest(BaseModel):
    equation: str
    x0: float
    x1: float
    max_iterations: int = 100
    tolerance: float = 1e-6

class SecantResponse(BaseModel):
    root: float
    iterations: int
    all_iterations: List[dict]
    error: float
    converged: bool
    message: Optional[str] = None