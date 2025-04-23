from ..utils.equation_parser import EquationParser

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
        if abs(f_curr - f_prev) >= 1e-10:
            x_next = x_curr - f_curr * (x_curr - x_prev) / (f_curr - f_prev)

        # Almacenar valores iniciales
        iterations.append({
            "iteration": iteration,
            "x_prev": x_prev,
            "x_curr": x_curr,
            "x_next": x_next,
            "f_prev": f_prev,
            "f_curr": f_curr,
            "error": error
        })

        while error > tolerance and iteration < max_iterations:
            # Verificar si el denominador está demasiado cerca de cero
            if abs(f_curr - f_prev) < 1e-10:
                return {
                    "root": None,
                    "iterations": iteration,
                    "all_iterations": iterations,
                    "error": error,
                    "converged": False,
                    "message": "Se encontró una división por un valor cercano a cero."
                }

            # Calcular la siguiente aproximación
            x_next = x_curr - f_curr * (x_curr - x_prev) / (f_curr - f_prev)

            # Actualizar para la siguiente iteración
            x_prev = x_curr
            x_curr = x_next

            f_prev = f_curr
            try:
                f_curr = parser.evaluate(x_curr)
            except ValueError as e:
                return {
                    "root": None,
                    "iterations": iteration + 1,
                    "all_iterations": iterations,
                    "error": error,
                    "converged": False,
                    "message": f"Error al evaluar la función en x={x_curr}: {str(e)}"
                }

            iteration += 1
            error = abs(x_curr - x_prev)

            # Calcular el próximo x_next para esta iteración
            next_x_next = None
            if iteration < max_iterations and error > tolerance and abs(f_curr - f_prev) >= 1e-10:
                next_x_next = x_curr - f_curr * (x_curr - x_prev) / (f_curr - f_prev)

            iterations.append({
                "iteration": iteration,
                "x_prev": x_prev,
                "x_curr": x_curr,
                "x_next": next_x_next,
                "f_prev": f_prev,
                "f_curr": f_curr,
                "error": error
            })

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
        return {
            "root": None,
            "iterations": 0,
            "all_iterations": [],
            "error": None,
            "converged": False,
            "message": f"Error: {str(e)}"
        }
    except Exception as e:
        return {
            "root": None,
            "iterations": 0,
            "all_iterations": [],
            "error": None,
            "converged": False,
            "message": f"Error inesperado: {str(e)}"
        }