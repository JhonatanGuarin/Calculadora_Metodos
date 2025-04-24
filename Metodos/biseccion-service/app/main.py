from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from app.models import BiseccionRequest, BiseccionResponse, IteracionBiseccion
from app.services.biseccion import biseccion
from app.utils.equation_parser import parse_equation
import traceback
import re

app = FastAPI(
    title="API de Método de Bisección",
    description="API para encontrar raíces de ecuaciones usando el método de bisección",
    version="1.0.0"
)


@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API del Método de Bisección"}

@app.post("/solve", response_model=BiseccionResponse)
def calcular_biseccion(request: BiseccionRequest):
    try:
        # Validar los límites del intervalo
        if not isinstance(request.a, (int, float)) or not isinstance(request.b, (int, float)):
            raise HTTPException(status_code=400, detail="Los límites del intervalo deben ser números")

        if request.a >= request.b:
            raise HTTPException(status_code=400, detail=f"El límite inferior ({request.a}) debe ser menor que el límite superior ({request.b})")

        # Validar la tolerancia y el número máximo de iteraciones
        if not isinstance(request.tol, (int, float)) or request.tol <= 0:
            raise HTTPException(status_code=400, detail="La tolerancia debe ser un número positivo")

        if not isinstance(request.max_iter, int) or request.max_iter <= 0:
            raise HTTPException(status_code=400, detail="El número máximo de iteraciones debe ser un entero positivo")

        # Parsear la ecuación (toda la validación está dentro de esta función)
        try:
            func = parse_equation(request.equation)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Error en la ecuación: {str(e)}")

        # Aplicar el método de bisección
        try:
            resultado = biseccion(
                f=func,
                a=request.a,
                b=request.b,
                tol=request.tol,
                max_iter=request.max_iter
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Error en el método de bisección: {str(e)}")
        except ZeroDivisionError:
            raise HTTPException(status_code=400, detail="División por cero al evaluar la ecuación.")

        # Verificar si el método encontró una raíz
        if resultado["raiz"] is None:
            raise HTTPException(status_code=400, detail=resultado["mensaje"])

        # Convertir los pasos al formato esperado
        pasos = [IteracionBiseccion(**paso) for paso in resultado["pasos"]]

        # Devolver el resultado
        return BiseccionResponse(
            raiz=resultado["raiz"],
            iteraciones=resultado["iteraciones"],
            pasos=pasos,
            mensaje=resultado["mensaje"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inesperado: {str(e)}")