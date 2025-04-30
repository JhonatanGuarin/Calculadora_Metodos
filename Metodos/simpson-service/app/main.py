from fastapi import FastAPI, HTTPException
from .models import SimpsonRequest, SimpsonResponse
from .services.simpson import SimpsonService
from .utils.equation_parser import parse_equation
import numpy as np

app = FastAPI(title="Método de Simpson API")

@app.post("/integrate", response_model=SimpsonResponse)
async def integrate_simpson(request: SimpsonRequest):
    try:
        # Validar la ecuación - debe contener x
        try:
            parse_equation(request.equation, require_x=True)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Ecuación inválida: {str(e)}")

        # Validar los límites de integración
        if request.a >= request.b:
            raise HTTPException(
                status_code=400,
                detail="El límite inferior (a) debe ser menor que el límite superior (b)"
            )

        # Validar el número de subintervalos
        if request.n <= 0:
            raise HTTPException(
                status_code=400,
                detail="El número de subintervalos debe ser mayor que cero"
            )

        # Validar que n sea par (requisito del método de Simpson)
        if request.n % 2 != 0:
            raise HTTPException(
                status_code=400,
                detail="El número de subintervalos debe ser par para el método de Simpson"
            )

        # Resolver usando el método de Simpson
        integral, subintervals, success, message = SimpsonService.integrate(
            request.equation,
            request.a,
            request.b,
            request.n
        )

        # Construir la respuesta
        response = SimpsonResponse(
            integral=integral,
            subintervals=subintervals,
            success=success,
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