from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from app.models import EulerRequest, EulerResponse, IteracionEuler
from app.services.euler import metodo_euler
from app.utils.equation_parser import parse_differential_equation
import traceback
import re

app = FastAPI(
    title="API de Método de Euler",
    description="API para resolver ecuaciones diferenciales ordinarias usando el método de Euler",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API del Método de Euler"}

@app.post("/solve", response_model=EulerResponse)
def calcular_euler(request: EulerRequest):
    try:
        # Validar los parámetros de entrada
        if not isinstance(request.x0, (int, float)) or not isinstance(request.y0, (int, float)):
            raise HTTPException(status_code=400, detail="Los valores iniciales deben ser números")

        if not isinstance(request.xf, (int, float)):
            raise HTTPException(status_code=400, detail="El valor final de x debe ser un número")

        if request.x0 >= request.xf:
            raise HTTPException(status_code=400, detail=f"El valor inicial x0 ({request.x0}) debe ser menor que el valor final xf ({request.xf})")

        if not isinstance(request.h, (int, float)) or request.h <= 0:
            raise HTTPException(status_code=400, detail="El tamaño del paso h debe ser un número positivo")

        if not isinstance(request.max_steps, int) or request.max_steps <= 0:
            raise HTTPException(status_code=400, detail="El número máximo de pasos debe ser un entero positivo")

        # Parsear la ecuación diferencial
        try:
            func = parse_differential_equation(request.equation)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Error en la ecuación diferencial: {str(e)}")

        # Aplicar el método de Euler
        try:
            resultado = metodo_euler(
                f=func,
                x0=request.x0,
                y0=request.y0,
                xf=request.xf,
                h=request.h,
                max_steps=request.max_steps
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Error en el método de Euler: {str(e)}")
        except ZeroDivisionError:
            raise HTTPException(status_code=400, detail="División por cero al evaluar la ecuación.")

        # Convertir los pasos al formato esperado
        pasos = [IteracionEuler(**paso) for paso in resultado["pasos"]]

        # Devolver el resultado
        return EulerResponse(
            solucion=pasos,
            mensaje=resultado["mensaje"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inesperado: {str(e)}")