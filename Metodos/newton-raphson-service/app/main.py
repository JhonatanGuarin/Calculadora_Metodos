from fastapi import FastAPI, HTTPException
from app.models import NewtonRaphsonRequest, NewtonRaphsonResponse
from app.services.newton_raphson import NewtonRaphsonMethod

app = FastAPI(
    title="Newton-Raphson Method API",
    description="API para encontrar raíces de ecuaciones usando el método de Newton-Raphson",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API del método de Newton-Raphson"}

@app.post("/solve", response_model=NewtonRaphsonResponse)
def solve_equation(request: NewtonRaphsonRequest):
    try:
        # Validar la ecuación y los parámetros
        if not request.equation or request.equation.isspace():
            raise ValueError("La ecuación no puede estar vacía")

        # Crear el solucionador y resolver
        solver = NewtonRaphsonMethod(
            equation=request.equation,
            x0=request.x0,
            tolerance=request.tolerance,
            max_iterations=request.max_iterations
        )
        result = solver.solve()
        return result
    except ValueError as e:
        # Errores de validación
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Otros errores inesperados
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")
