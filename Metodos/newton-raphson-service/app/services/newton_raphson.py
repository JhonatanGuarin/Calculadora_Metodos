from app.utils.equation_parser import EquationParser
from app.models import NewtonRaphsonResponse
import numpy as np

class NewtonRaphsonMethod:
    def __init__(self, equation: str, x0: float, tolerance: float = 1e-6, max_iterations: int = 100):
        self.equation_parser = EquationParser(equation)
        self.x0 = x0
        self.tolerance = tolerance
        self.max_iterations = max_iterations

    def solve(self) -> NewtonRaphsonResponse:
        """
        Implementa el método de Newton-Raphson para encontrar raíces de ecuaciones.

        El método utiliza la fórmula: x_{n+1} = x_n - f(x_n)/f'(x_n)
        """
        x = self.x0
        iterations = 0
        all_iterations = []
        error = float('inf')

        try:
            while iterations < self.max_iterations and error > self.tolerance:
                fx = self.equation_parser.evaluate(x)
                dfx = self.equation_parser.evaluate_derivative(x)

                # Verificar si la derivada es cercana a cero para evitar división por cero
                if abs(dfx) < 1e-10:
                    return NewtonRaphsonResponse(
                        root=None,
                        iterations=iterations,
                        convergence=False,
                        error=None,
                        all_iterations=all_iterations,
                        message="La derivada es cercana a cero. El método no puede continuar."
                    )

                # Calcular el siguiente valor de x
                x_next = x - fx / dfx

                # Calcular el error
                error = abs(x_next - x)

                # Guardar información de esta iteración
                iteration_info = {
                    "iteration": iterations + 1,
                    "x": x,
                    "f(x)": fx,
                    "f'(x)": dfx,
                    "next_x": x_next,
                    "error": error
                }
                all_iterations.append(iteration_info)

                # Actualizar x para la siguiente iteración
                x = x_next
                iterations += 1

            # Verificar convergencia
            convergence = error <= self.tolerance

            return NewtonRaphsonResponse(
                root=x if convergence else None,
                iterations=iterations,
                convergence=convergence,
                error=error,
                all_iterations=all_iterations,
                message="Método convergió exitosamente." if convergence else
                        f"Método no convergió después de {iterations} iteraciones."
            )

        except Exception as e:
            return NewtonRaphsonResponse(
                root=None,
                iterations=iterations,
                convergence=False,
                error=None,
                all_iterations=all_iterations,
                message=f"Error durante la ejecución: {str(e)}"
            )