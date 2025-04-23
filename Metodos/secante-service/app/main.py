from fastapi import FastAPI, HTTPException
from .models import SecantRequest, SecantResponse
from .services.secante import secante_method

app = FastAPI(
    title="API del Método de la Secante",
    description="API para encontrar raíces de ecuaciones usando el método de la Secante",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API del Método de la Secante"}

@app.post("/solve", response_model=SecantResponse)
def solve_with_secante(request: SecantRequest):
    try:
        result = secante_method(
            request.equation,
            request.x0,
            request.x1,
            request.max_iterations,
            request.tolerance
        )

        if result["root"] is None:
            raise HTTPException(status_code=400, detail=result["message"])

        return SecantResponse(
            root=result["root"],
            iterations=result["iterations"],
            all_iterations=result["all_iterations"],
            error=result["error"],
            converged=result["converged"],
            message=result["message"]
        )

    except HTTPException:
        # Re-lanzar excepciones HTTP
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))