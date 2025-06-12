from typing import Dict, List, Tuple, Any, Callable, Optional
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

def find_potential_roots(f, a, b, num_points=100, tol=1e-6):
    """
    Busca posibles raíces en un intervalo dividiendo el intervalo en subintervalos
    y buscando cambios de signo.
    
    Args:
        f: Función a evaluar
        a: Límite inferior del intervalo
        b: Límite superior del intervalo
        num_points: Número de puntos para dividir el intervalo
        tol: Tolerancia para considerar un valor como cero
        
    Returns:
        Lista de tuplas (x1, x2, es_raiz_exacta, valor_aproximado) donde cada tupla 
        representa un subintervalo que potencialmente contiene una raíz
    """
    step = (b - a) / num_points
    potential_roots = []
    
    # Evaluar la función en el primer punto
    x_prev = a
    try:
        f_prev = _safe_function_evaluation(f, x_prev, "a")
    except Exception:
        f_prev = None
    
    # Si f(a) es aproximadamente cero, agregar a como raíz exacta
    if f_prev is not None and abs(f_prev) < tol:
        potential_roots.append((x_prev, x_prev, True, x_prev))  # (a, b, es_raiz_exacta, valor_aproximado)
    
    # Recorrer el intervalo buscando cambios de signo
    for i in range(1, num_points + 1):
        x_curr = a + i * step if i < num_points else b  # Asegurar que el último punto sea exactamente b
        
        try:
            f_curr = _safe_function_evaluation(f, x_curr, f"punto_{i}")
        except Exception:
            continue
        
        # Si f(x_curr) es aproximadamente cero, agregar como raíz exacta
        if abs(f_curr) < tol:
            potential_roots.append((x_curr, x_curr, True, x_curr))  # Raíz exacta
        # Si hay un cambio de signo, agregar el subintervalo
        elif f_prev is not None and f_prev * f_curr < 0:
            # Calcular un valor aproximado para la raíz usando interpolación lineal
            # (método de la regla falsa para una primera aproximación)
            if abs(f_curr - f_prev) > 1e-10:  # Evitar división por cero
                x_approx = x_prev - f_prev * (x_curr - x_prev) / (f_curr - f_prev)
            else:
                x_approx = (x_prev + x_curr) / 2
            
            potential_roots.append((x_prev, x_curr, False, x_approx))
        
        x_prev = x_curr
        f_prev = f_curr
    
    return potential_roots

def biseccion(f: Callable, a: float, b: float, tol: float = 1e-6, max_iter: int = 100, 
              seleccionar_raiz: Optional[int] = None, forzar_busqueda: bool = False) -> Dict[str, Any]:
    """
    Implementa el método de bisección para encontrar raíces de una función.

    Args:
        f: Función a la que se le busca la raíz
        a: Límite inferior del intervalo
        b: Límite superior del intervalo
        tol: Tolerancia para el criterio de parada
        max_iter: Número máximo de iteraciones
        seleccionar_raiz: Índice de la raíz a seleccionar (si hay múltiples)
        forzar_busqueda: Si es True, siempre busca múltiples raíces en el intervalo

    Returns:
        Un diccionario con los resultados del método
    """
    # Validar los parámetros de entrada
    _validate_numeric_input(a, b, tol, max_iter)

    # Si se fuerza la búsqueda de múltiples raíces
    if forzar_busqueda:
        # Buscar posibles raíces en el intervalo
        potential_roots = find_potential_roots(f, a, b, num_points=100, tol=tol)
        
        # Convertir las raíces potenciales al formato esperado
        raices_potenciales = [
            {
                "intervalo_inferior": float(x1),
                "intervalo_superior": float(x2),
                "es_raiz_exacta": es_exacta,
                "valor_aproximado": float(valor_aprox)
            }
            for x1, x2, es_exacta, valor_aprox in potential_roots
        ]
        
        # Si no se encontraron raíces potenciales
        if not potential_roots:
            return {
                "raiz": None,
                "iteraciones": 0,
                "pasos": [],
                "mensaje": f"No se encontraron raíces en el intervalo [{a}, {b}].",
                "raices_potenciales": []
            }
        
        # Si se especificó un índice de raíz a seleccionar
        if seleccionar_raiz is not None and 0 <= seleccionar_raiz < len(raices_potenciales):
            raiz_seleccionada = raices_potenciales[seleccionar_raiz]
            
            # Si es una raíz exacta, devolverla directamente
            if raiz_seleccionada["es_raiz_exacta"]:
                return {
                    "raiz": raiz_seleccionada["valor_aproximado"],
                    "iteraciones": 0,
                    "pasos": [],
                    "mensaje": f"Se encontró una raíz exacta en x={raiz_seleccionada['valor_aproximado']}.",
                    "raices_potenciales": raices_potenciales
                }
            
            # Si no es exacta, aplicar bisección en el subintervalo
            nuevo_a = raiz_seleccionada["intervalo_inferior"]
            nuevo_b = raiz_seleccionada["intervalo_superior"]
            
            # Llamada recursiva a bisección con el nuevo intervalo (sin forzar búsqueda)
            resultado = biseccion(f, nuevo_a, nuevo_b, tol, max_iter)
            
            # Agregar la información de raíces potenciales al resultado
            resultado["raices_potenciales"] = raices_potenciales
            return resultado
        
        # Si no se especificó un índice pero hay raíces potenciales, informar al usuario
        return {
            "raiz": None,
            "iteraciones": 0,
            "pasos": [],
            "mensaje": f"Se encontraron {len(raices_potenciales)} posibles raíces en el intervalo [{a}, {b}]. Seleccione una para continuar.",
            "raices_potenciales": raices_potenciales
        }
    
    # Procedimiento normal de bisección
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

        # Buscar posibles raíces en el intervalo
        potential_roots = find_potential_roots(f, a, b, num_points=100, tol=tol)
        
        # Convertir las raíces potenciales al formato esperado
        raices_potenciales = [
            {
                "intervalo_inferior": float(x1),
                "intervalo_superior": float(x2),
                "es_raiz_exacta": es_exacta,
                "valor_aproximado": float(valor_aprox)
            }
            for x1, x2, es_exacta, valor_aprox in potential_roots
        ]
        
        # Si no se encontraron raíces potenciales
        if not potential_roots:
            return {
                "raiz": None,
                "iteraciones": 0,
                "pasos": [],
                "mensaje": f"El intervalo [{a}, {b}] no contiene una raíz o contiene múltiples raíces. f(a)={fa}, f(b)={fb}.",
                "raices_potenciales": []
            }
        
        # Si se especificó un índice de raíz a seleccionar
        if seleccionar_raiz is not None and 0 <= seleccionar_raiz < len(raices_potenciales):
            raiz_seleccionada = raices_potenciales[seleccionar_raiz]
            
            # Si es una raíz exacta, devolverla directamente
            if raiz_seleccionada["es_raiz_exacta"]:
                return {
                    "raiz": raiz_seleccionada["valor_aproximado"],
                    "iteraciones": 0,
                    "pasos": [],
                    "mensaje": f"Se encontró una raíz exacta en x={raiz_seleccionada['valor_aproximado']}.",
                    "raices_potenciales": raices_potenciales
                }
            
            # Si no es exacta, aplicar bisección en el subintervalo
            nuevo_a = raiz_seleccionada["intervalo_inferior"]
            nuevo_b = raiz_seleccionada["intervalo_superior"]
            
            # Llamada recursiva a bisección con el nuevo intervalo
            resultado = biseccion(f, nuevo_a, nuevo_b, tol, max_iter)
            
            # Agregar la información de raíces potenciales al resultado
            resultado["raices_potenciales"] = raices_potenciales
            return resultado
        
        # Si no se especificó un índice pero hay raíces potenciales, informar al usuario
        return {
            "raiz": None,
            "iteraciones": 0,
            "pasos": [],
            "mensaje": f"Se encontraron {len(raices_potenciales)} posibles raíces en el intervalo [{a}, {b}]. Seleccione una para continuar.",
            "raices_potenciales": raices_potenciales
        }

    # Si f(a) y f(b) tienen signos opuestos, aplicar el método de bisección normal
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