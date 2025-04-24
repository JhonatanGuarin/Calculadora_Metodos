from typing import Dict, List, Tuple, Any, Callable
import numpy as np
import math

def _validate_numeric_input(a, b, tol, max_iter):
    """Función auxiliar para validar los parámetros de entrada"""
    if not isinstance(a, (int, float)):
        raise ValueError("El límite inferior 'a' debe ser un número")

    if not isinstance(b, (int, float)):
        raise ValueError("El límite superior 'b' debe ser un número")

    if math.isnan(a) or math.isinf(a):
        raise ValueError("El límite inferior 'a' debe ser un número finito")

    if math.isnan(b) or math.isinf(b):
        raise ValueError("El límite superior 'b' debe ser un número finito")

    if a >= b:
        raise ValueError("El límite inferior 'a' debe ser menor que el límite superior 'b'")

    if not isinstance(tol, (int, float)) or tol <= 0:
        raise ValueError("La tolerancia debe ser un número positivo")

    if not isinstance(max_iter, int) or max_iter <= 0:
        raise ValueError("El número máximo de iteraciones debe ser un entero positivo")

def _safe_function_evaluation(f, x, point_name):
    """Función auxiliar para evaluar una función de manera segura"""
    try:
        result = f(x)
    except Exception as e:
        raise ValueError(f"Error al evaluar la función en {point_name}={x}: {str(e)}")

    if math.isnan(result) or math.isinf(result):
        raise ValueError(f"La función evaluada en {point_name}={x} da como resultado un valor no válido: {result}")

    return result

def biseccion(f: Callable, a: float, b: float, tol: float = 1e-6, max_iter: int = 100) -> Dict[str, Any]:
    """
    Implementa el método de bisección para encontrar raíces de una función.

    Args:
        f: Función a la que se le busca la raíz
        a: Límite inferior del intervalo
        b: Límite superior del intervalo
        tol: Tolerancia para el criterio de parada
        max_iter: Número máximo de iteraciones

    Returns:
        Un diccionario con los resultados del método
    """
    # Validar los parámetros de entrada
    _validate_numeric_input(a, b, tol, max_iter)

    # Evaluar la función en los extremos del intervalo
    fa = _safe_function_evaluation(f, a, "a")
    fb = _safe_function_evaluation(f, b, "b")

    # Verificar que f(a) y f(b) tengan signos opuestos
    if fa * fb >= 0:
        # Verificar si alguno de los extremos es una raíz
        if abs(fa) < tol:
            return {
                "raiz": float(a),
                "iteraciones": 0,
                "pasos": [],
                "mensaje": f"El punto a={a} es una raíz de la función (f(a)={fa})."
            }

        if abs(fb) < tol:
            return {
                "raiz": float(b),
                "iteraciones": 0,
                "pasos": [],
                "mensaje": f"El punto b={b} es una raíz de la función (f(b)={fb})."
            }

        return {
            "raiz": None,
            "iteraciones": 0,
            "pasos": [],
            "mensaje": f"El intervalo [{a}, {b}] no contiene una raíz o contiene múltiples raíces. f(a)={fa}, f(b)={fb}."
        }

    pasos = []
    c_prev = None

    for i in range(max_iter):
        # Calcular el punto medio
        c = (a + b) / 2

        # Evaluar la función en el punto medio
        fc = _safe_function_evaluation(f, c, "c")

        # Calcular el error porcentual si es posible
        error_porcentual = None
        if c_prev is not None and c != 0:
            error_porcentual = abs((c - c_prev) / c) * 100

        # Guardar información de esta iteración
        pasos.append({
            "iteracion": i + 1,
            "punto_a": float(a),
            "punto_b": float(b),
            "punto_medio": float(c),
            "error_porcentual": float(error_porcentual) if error_porcentual is not None else None
        })

        # Verificar si hemos encontrado la raíz exacta
        if abs(fc) < tol:
            return {
                "raiz": float(c),
                "iteraciones": i + 1,
                "pasos": pasos,
                "mensaje": f"Raíz encontrada con precisión de {tol} en {i+1} iteraciones."
            }

        # Verificar si hemos alcanzado la tolerancia deseada en el error porcentual
        if error_porcentual is not None and error_porcentual < tol * 100 and i > 0:
            return {
                "raiz": float(c),
                "iteraciones": i + 1,
                "pasos": pasos,
                "mensaje": f"Método convergió en {i+1} iteraciones."
            }

        # Actualizar el intervalo [a, b]
        if fa * fc < 0:
            b = c
            fb = fc
        else:
            a = c
            fa = fc

        c_prev = c

    # Si llegamos aquí, alcanzamos el número máximo de iteraciones
    return {
        "raiz": float(c),
        "iteraciones": max_iter,
        "pasos": pasos,
        "mensaje": f"Se alcanzó el número máximo de iteraciones ({max_iter}) sin convergencia. La mejor aproximación es {c} con un error porcentual de {error_porcentual if error_porcentual is not None else 'desconocido'}%."
    }