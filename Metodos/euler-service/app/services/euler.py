from typing import Dict, List, Tuple, Any, Callable
import numpy as np
import math

def _validate_numeric_input(x0, y0, xf, h, max_steps):
    """Función auxiliar para validar los parámetros de entrada"""
    if not isinstance(x0, (int, float)):
        raise ValueError("El valor inicial x0 debe ser un número")

    if not isinstance(y0, (int, float)):
        raise ValueError("El valor inicial y0 debe ser un número")

    if not isinstance(xf, (int, float)):
        raise ValueError("El valor final xf debe ser un número")

    if math.isnan(x0) or math.isinf(x0):
        raise ValueError("El valor inicial x0 debe ser un número finito")

    if math.isnan(y0) or math.isinf(y0):
        raise ValueError("El valor inicial y0 debe ser un número finito")

    if math.isnan(xf) or math.isinf(xf):
        raise ValueError("El valor final xf debe ser un número finito")

    if x0 >= xf:
        raise ValueError("El valor inicial x0 debe ser menor que el valor final xf")

    if not isinstance(h, (int, float)) or h <= 0:
        raise ValueError("El tamaño del paso h debe ser un número positivo")

    if not isinstance(max_steps, int) or max_steps <= 0:
        raise ValueError("El número máximo de pasos debe ser un entero positivo")

def _safe_function_evaluation(f, x, y, point_name):
    """Función auxiliar para evaluar una función de manera segura"""
    try:
        result = f(x, y)
    except Exception as e:
        raise ValueError(f"Error al evaluar la función en {point_name}=({x}, {y}): {str(e)}")

    if math.isnan(result) or math.isinf(result):
        raise ValueError(f"La función evaluada en {point_name}=({x}, {y}) da como resultado un valor no válido: {result}")

    return result

def metodo_euler(f: Callable, x0: float, y0: float, xf: float, h: float, max_steps: int = 1000) -> Dict[str, Any]:
    """
    Implementa el método de Euler para resolver ecuaciones diferenciales ordinarias.

    Args:
        f: Función que representa la ecuación diferencial dy/dx = f(x,y)
        x0: Valor inicial de x
        y0: Valor inicial de y
        xf: Valor final de x
        h: Tamaño del paso
        max_steps: Número máximo de pasos

    Returns:
        Un diccionario con los resultados del método
    """
    # Validar los parámetros de entrada
    _validate_numeric_input(x0, y0, xf, h, max_steps)

    # Inicializar variables
    x = x0
    y = y0
    pasos = []
    n_steps = 0

    # Evaluar la función en el punto inicial
    dy_dx = _safe_function_evaluation(f, x, y, "punto_inicial")

    # Guardar el punto inicial
    pasos.append({
        "paso": n_steps,
        "x": float(x),
        "y": float(y),
        "dy_dx": float(dy_dx)
    })

    # Aplicar el método de Euler
    while x < xf and n_steps < max_steps:
        # Incrementar el contador de pasos
        n_steps += 1

        # Calcular el nuevo valor de y usando el método de Euler
        y_new = y + h * dy_dx
        
        # Actualizar x
        x_new = x + h
        
        # Asegurarse de no sobrepasar xf
        if x_new > xf:
            h = xf - x
            x_new = xf
            y_new = y + h * dy_dx
        
        # Actualizar x e y
        x = x_new
        y = y_new
        
        # Evaluar la función en el nuevo punto
        dy_dx = _safe_function_evaluation(f, x, y, f"paso_{n_steps}")
        
        # Guardar este paso
        pasos.append({
            "paso": n_steps,
            "x": float(x),
            "y": float(y),
            "dy_dx": float(dy_dx)
        })

    # Preparar el mensaje de resultado
    if x >= xf:
        mensaje = f"Solución calculada con éxito hasta x={xf} en {n_steps} pasos."
    else:
        mensaje = f"Se alcanzó el número máximo de pasos ({max_steps}) sin llegar a x={xf}. La solución se calculó hasta x={x}."

    return {
        "pasos": pasos,
        "mensaje": mensaje
    }