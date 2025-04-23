from fastapi import FastAPI, HTTPException
from .models import PuntoFijoRequest, PuntoFijoResponse
from .services.punto_fijo import PuntoFijoService
from .utils.equation_parser import parse_equation
import numpy as np 

app = FastAPI(title="Método de Punto Fijo API")

@app.post("/solve", response_model=PuntoFijoResponse)
async def solve_punto_fijo(request: PuntoFijoRequest):
    try:
        # Validar la ecuación f(x) - debe contener x
        try:
            parse_equation(request.equation, require_x=True)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Ecuación inválida: {str(e)}")

        # Validar la función g(x) - puede no contener x (ser constante)
        try:
            g_func = parse_equation(request.g_function, require_x=False)

            # Verificar que g(x) sea adecuada para punto fijo
            # Probar con el valor inicial
            try:
                g_initial = g_func(request.initial_x)
                if np.isnan(g_initial) or np.isinf(g_initial):
                    raise HTTPException(
                        status_code=400,
                        detail=f"La función g(x) produce un valor no válido en el punto inicial x={request.initial_x}. Verifique la función g(x) y el valor inicial."
                    )
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Error al evaluar g(x) en el punto inicial: {str(e)}"
                )

        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Función g(x) inválida: {str(e)}")

        # Resolver usando el método de punto fijo
        root, iterations, converged, message = PuntoFijoService.solve(
            request.g_function,
            request.initial_x,
            request.tolerance,
            request.max_iterations
        )

        # Construir la respuesta
        response = PuntoFijoResponse(
            root=root,
            iterations=iterations,
            converged=converged,
            message=message
        )

        return response
    except HTTPException:
        # Re-lanzar excepciones HTTP ya formateadas
        raise
    except Exception as e:
        # Capturar cualquier otro error no manejado
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@app.get("/")
async def health_check():
    return {"status": "healthy"}