from fastapi import FastAPI, HTTPException
from app.models import BroydenRequest, BroydenResponse
from app.services.broyden import BroydenMethod

app = FastAPI(
    title="Broyden Method API",
    description="API para encontrar raíces de ecuaciones usando el método de Broyden",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API del método de Broyden"}

@app.post("/solve", response_model=BroydenResponse)
def solve_equation(request: BroydenRequest):
    try:
        # Validar la ecuación
        if not request.equation or request.equation.isspace():
            raise ValueError("La ecuación no puede estar vacía")

        # Crear el solucionador y resolver
        try:
            solver = BroydenMethod(
                equation=request.equation,
                x0=request.x0,
                tolerance=request.tolerance,
                max_iterations=request.max_iterations
            )
            result = solver.solve()
            return result
        except ValueError as e:
            raise ValueError(f"Error en el método de Broyden: {str(e)}")

    except ValueError as e:
        # Errores de validación
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Otros errores inesperados
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")