from ..utils.equation_parser import EquationParser

def _validate_parameters(x0, x1, max_iterations, tolerance):
    """
    Valida los parámetros de entrada del método de la secante.

    Args:
        x0: Primera aproximación inicial
        x1: Segunda aproximación inicial
        max_iterations: Número máximo de iteraciones
        tolerance: Tolerancia de convergencia

    Raises:
        ValueError: Si algún parámetro no es válido
    """
    # Validar x0 y x1
    if not isinstance(x0, (int, float)):
        raise ValueError("La primera aproximación inicial (x0) debe ser un número")
    if not isinstance(x1, (int, float)):
        raise ValueError("La segunda aproximación inicial (x1) debe ser un número")

    # Validar max_iterations
    if not isinstance(max_iterations, int) or max_iterations <= 0:
        raise ValueError("El número máximo de iteraciones debe ser un entero positivo")

    # Validar tolerance
    if not isinstance(tolerance, (int, float)) or tolerance <= 0:
        raise ValueError("La tolerancia debe ser un número positivo")

def _create_iteration_info(iteration, x_prev, x_curr, x_next, f_prev, f_curr, error):
    """
    Crea un diccionario con la información de una iteración.

    Args:
        iteration: Número de iteración
        x_prev: Valor anterior de x
        x_curr: Valor actual de x
        x_next: Próximo valor de x
        f_prev: Valor de la función en x_prev
        f_curr: Valor de la función en x_curr
        error: Error estimado

    Returns:
        dict: Información de la iteración
    """
    return {
        "iteration": iteration,
        "x_prev": x_prev,
        "x_curr": x_curr,
        "x_next": x_next,
        "f_prev": f_prev,
        "f_curr": f_curr,
        "error": error
    }

def _create_error_response(message, iteration=0, iterations=None, error=None):
    """
    Crea una respuesta de error.

    Args:
        message: Mensaje de error
        iteration: Número de iteración donde ocurrió el error
        iterations: Lista de iteraciones realizadas
        error: Error estimado

    Returns:
        dict: Respuesta de error
    """
    return {
        "root": None,
        "iterations": iteration,
        "all_iterations": iterations if iterations is not None else [],
        "error": error,
        "converged": False,
        "message": message
    }

def _calculate_next_x(x_curr, x_prev, f_curr, f_prev):
    """
    Calcula la siguiente aproximación usando el método de la secante.

    Args:
        x_curr: Valor actual de x
        x_prev: Valor anterior de x
        f_curr: Valor de la función en x_curr
        f_prev: Valor de la función en x_prev

    Returns:
        float: Siguiente aproximación

    Raises:
        ValueError: Si el denominador está demasiado cerca de cero
    """
    if abs(f_curr - f_prev) < 1e-10:
        raise ValueError("Se encontró una división por un valor cercano a cero.")

    return x_curr - f_curr * (x_curr - x_prev) / (f_curr - f_prev)

def secante_method(equation_str, x0, x1, max_iterations=100, tolerance=1e-6):
    """
    Implementa el método de la Secante para encontrar la raíz de una ecuación.

    Args:
        equation_str (str): Representación en texto de la ecuación
        x0 (float): Primera aproximación inicial
        x1 (float): Segunda aproximación inicial
        max_iterations (int): Número máximo de iteraciones
        tolerance (float): Tolerancia de convergencia

    Returns:
        dict: Resultados incluyendo raíz, iteraciones, estado de convergencia, etc.
    """
    try:
        # Validar parámetros
        _validate_parameters(x0, x1, max_iterations, tolerance)

        # Parsear y validar la ecuación
        parser = EquationParser(equation_str)

        # Validar los puntos iniciales
        parser.validate_initial_points(x0, x1)

        iterations = []
        x_prev = x0
        x_curr = x1

        f_prev = parser.evaluate(x_prev)
        f_curr = parser.evaluate(x_curr)

        iteration = 0
        error = abs(x_curr - x_prev)

        # Para la primera iteración, calculamos x_next para incluirlo en los resultados
        x_next = None
        try:
            if abs(f_curr - f_prev) >= 1e-10:
                x_next = _calculate_next_x(x_curr, x_prev, f_curr, f_prev)
        except ValueError:
            # Si hay un error al calcular x_next, lo dejamos como None
            pass

        # Almacenar valores iniciales
        iterations.append(_create_iteration_info(
            iteration, x_prev, x_curr, x_next, f_prev, f_curr, error
        ))

        while error > tolerance and iteration < max_iterations:
            try:
                # Calcular la siguiente aproximación
                x_next = _calculate_next_x(x_curr, x_prev, f_curr, f_prev)
            except ValueError as e:
                return _create_error_response(
                    str(e), iteration, iterations, error
                )

            # Actualizar para la siguiente iteración
            x_prev = x_curr
            x_curr = x_next

            f_prev = f_curr
            try:
                f_curr = parser.evaluate(x_curr)
            except ValueError as e:
                return _create_error_response(
                    f"Error al evaluar la función en x={x_curr}: {str(e)}",
                    iteration + 1, iterations, error
                )

            iteration += 1
            error = abs(x_curr - x_prev)

            # Calcular el próximo x_next para esta iteración
            next_x_next = None
            try:
                if iteration < max_iterations and error > tolerance:
                    next_x_next = _calculate_next_x(x_curr, x_prev, f_curr, f_prev)
            except ValueError:
                # Si hay un error al calcular next_x_next, lo dejamos como None
                pass

            iterations.append(_create_iteration_info(
                iteration, x_prev, x_curr, next_x_next, f_prev, f_curr, error
            ))

        converged = error <= tolerance

        return {
            "root": x_curr,
            "iterations": iteration,
            "all_iterations": iterations,
            "error": error,
            "converged": converged,
            "message": "Convergencia alcanzada." if converged else "Se alcanzó el máximo de iteraciones sin convergencia."
        }

    except ValueError as e:
        return _create_error_response(f"Error: {str(e)}")
    except Exception as e:
        return _create_error_response(f"Error inesperado: {str(e)}")