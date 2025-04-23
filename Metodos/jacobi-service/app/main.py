from fastapi import FastAPI, HTTPException
from .models import JacobiRequest, JacobiResponse
from .services.jacobi import jacobi_method
from .utils.matrix_utils import MatrixValidator
import numpy as np

app = FastAPI(title="Jacobi Method API",
              description="API para resolver sistemas de ecuaciones lineales usando el método de Jacobi",
              version="1.0.0")

@app.post("/solve", response_model=JacobiResponse)
async def solve(request: JacobiRequest):
    try:
        # Inicializar el validador de matrices
        validator = MatrixValidator(
            A=request.A,
            b=request.b,
            initial_guess=request.initial_guess
        )

        # Obtener resumen de validaciones
        validation_summary = validator.get_validation_summary()

        # Verificar condiciones de convergencia
        convergence_check = validation_summary["convergence"]

        # Si hay advertencias sobre la convergencia, incluirlas en la respuesta
        warnings = convergence_check.get("warnings", [])

        # Si el método no convergerá, lanzar una excepción
        if not convergence_check["will_converge"] and len(warnings) > 0:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "El método de Jacobi no convergerá para esta matriz",
                    "warnings": warnings,
                    "details": convergence_check.get("details", {})
                }
            )

        # Establecer aproximación inicial si no se proporciona
        initial_guess = request.initial_guess
        if initial_guess is None:
            initial_guess = [0.0] * len(request.b)

        # Resolver usando el método de Jacobi
        solution, iterations, error, converged = jacobi_method(
            A=request.A,
            b=request.b,
            initial_guess=initial_guess,
            max_iterations=request.max_iterations,
            tolerance=request.tolerance
        )

        # Construir la respuesta
        response = JacobiResponse(
            solution=solution,
            iterations=iterations,
            error=error,
            converged=converged
        )

        # Si hay advertencias pero el método podría converger, incluirlas en la respuesta
        if warnings:
            response_dict = response.dict()
            response_dict["warnings"] = warnings
            response_dict["convergence_details"] = convergence_check.get("details", {})
            return response_dict

        return response

    except ValueError as e:
        # Capturar errores de validación
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Capturar cualquier otro error
        raise HTTPException(status_code=500, detail=f"Error al resolver el sistema: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Bienvenido a la API del Método de Jacobi"}

@app.get("/validate")
async def validate_matrix(request: JacobiRequest):
    """
    Endpoint para validar una matriz sin resolver el sistema.
    Útil para verificar si el método de Jacobi convergerá.
    """
    try:
        # Inicializar el validador de matrices
        validator = MatrixValidator(
            A=request.A,
            b=request.b,
            initial_guess=request.initial_guess
        )

        # Obtener resumen de validaciones
        validation_summary = validator.get_validation_summary()

        # Estimar el número de iteraciones
        estimated_iterations = validator.estimate_iterations(request.tolerance)
        validation_summary["estimated_iterations"] = estimated_iterations

        return validation_summary

    except ValueError as e:
        # Capturar errores de validación
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Capturar cualquier otro error
        raise HTTPException(status_code=500, detail=f"Error al validar la matriz: {str(e)}")