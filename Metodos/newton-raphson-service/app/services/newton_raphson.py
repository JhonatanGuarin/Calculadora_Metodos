from app.utils.equation_parser import EquationParser
from app.models import NewtonRaphsonResponse
import numpy as np

class NewtonRaphsonMethod:
    def __init__(self, equation: str, x0: float, tolerance: float = 1e-6, max_iterations: int = 100):
        """
        Inicializa el método de Newton-Raphson.

        Args:
            equation: Ecuación para encontrar raíces
            x0: Valor inicial para comenzar la iteración
            tolerance: Tolerancia para el criterio de convergencia
            max_iterations: Número máximo de iteraciones
        """
        self._validate_parameters(x0, tolerance, max_iterations)
        self.equation_parser = EquationParser(equation)
        self.x0 = x0
        self.tolerance = tolerance
        self.max_iterations = max_iterations

    def _validate_parameters(self, x0: float, tolerance: float, max_iterations: int) -> None:
        """
        Valida los parámetros de entrada.

        Args:
            x0: Valor inicial
            tolerance: Tolerancia
            max_iterations: Número máximo de iteraciones

        Raises:
            ValueError: Si algún parámetro no es válido
        """
        # Validar x0
        if not isinstance(x0, (int, float)):
            raise ValueError("El valor inicial debe ser un número")

        # Validar tolerancia
        if not isinstance(tolerance, (int, float)) or tolerance <= 0:
            raise ValueError("La tolerancia debe ser un número positivo")

        # Validar max_iterations
        if not isinstance(max_iterations, int) or max_iterations <= 0:
            raise ValueError("El número máximo de iteraciones debe ser un entero positivo")

    def _check_derivative_near_zero(self, dfx: float, iterations: int, all_iterations: list) -> NewtonRaphsonResponse:
        """
        Verifica si la derivada es cercana a cero y devuelve una respuesta apropiada.
        """
        return NewtonRaphsonResponse(
            root=None,
            iterations=iterations,
            convergence=False,
            error=None,
            all_iterations=all_iterations,
            message="La derivada es cercana a cero. El método no puede continuar."
        )

    def _create_iteration_info(self, iteration: int, x: float, fx: float, dfx: float, x_next: float, error: float) -> dict:
        """
        Crea un diccionario con la información de una iteración.
        """
        return {
            "iteration": iteration + 1,
            "x": x,
            "f(x)": fx,
            "f'(x)": dfx,
            "next_x": x_next,
            "error": error
        }

    def _create_response(self, x: float, iterations: int, convergence: bool, error: float, all_iterations: list) -> NewtonRaphsonResponse:
        """
        Crea una respuesta con los resultados del método.
        """
        return NewtonRaphsonResponse(
            root=x if convergence else None,
            iterations=iterations,
            convergence=convergence,
            error=error,
            all_iterations=all_iterations,
            message="Método convergió exitosamente." if convergence else
                    f"Método no convergió después de {iterations} iteraciones."
        )

    def solve(self) -> NewtonRaphsonResponse:
        """
        Implementa el método de Newton-Raphson para encontrar raíces de ecuaciones.

        El método utiliza la fórmula: x_{n+1} = x_n - f(x_n)/f'(x_n)

        Returns:
            NewtonRaphsonResponse: Objeto con los resultados del método
        """
        x = self.x0
        iterations = 0
        all_iterations = []
        error = float('inf')

        try:
            while iterations < self.max_iterations and error > self.tolerance:
                # Evaluar la función y su derivada en el punto actual
                fx = self.equation_parser.evaluate(x)
                dfx = self.equation_parser.evaluate_derivative(x)

                # Verificar si la derivada es cercana a cero para evitar división por cero
                if abs(dfx) < 1e-10:
                    return self._check_derivative_near_zero(dfx, iterations, all_iterations)

                # Calcular el siguiente valor de x
                x_next = x - fx / dfx

                # Calcular el error
                error = abs(x_next - x)

                # Guardar información de esta iteración
                iteration_info = self._create_iteration_info(iterations, x, fx, dfx, x_next, error)
                all_iterations.append(iteration_info)

                # Actualizar x para la siguiente iteración
                x = x_next
                iterations += 1

            # Verificar convergencia
            convergence = error <= self.tolerance

            # Crear y devolver la respuesta
            return self._create_response(x, iterations, convergence, error, all_iterations)

        except Exception as e:
            return NewtonRaphsonResponse(
                root=None,
                iterations=iterations,
                convergence=False,
                error=None,
                all_iterations=all_iterations,
                message=f"Error durante la ejecución: {str(e)}"
            )