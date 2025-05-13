from app.utils.equation_parser import EquationParser
from app.models import BroydenResponse
import numpy as np

class BroydenMethod:
    def __init__(self, equation: str, x0: float, tolerance: float = 1e-6, max_iterations: int = 100):
        """
        Inicializa el método de Broyden.

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

    def _create_iteration_info(self, iteration: int, x: float, fx: float, B: float, s: float, y: float, x_next: float, error: float) -> dict:
        """
        Crea un diccionario con la información de una iteración.
        """
        return {
            "iteration": iteration + 1,
            "x": x,
            "f(x)": fx,
            "B": float(B),  # Convertir a float para serialización
            "s": float(s),
            "y": float(y),
            "next_x": x_next,
            "error": error
        }

    def _create_response(self, x: float, iterations: int, convergence: bool, error: float, all_iterations: list) -> BroydenResponse:
        """
        Crea una respuesta con los resultados del método.
        """
        return BroydenResponse(
            root=x if convergence else None,
            iterations=iterations,
            convergence=convergence,
            error=error,
            all_iterations=all_iterations,
            message="Método convergió exitosamente." if convergence else
                    f"Método no convergió después de {iterations} iteraciones."
        )

    def solve(self) -> BroydenResponse:
        """
        Implementa el método de Broyden para encontrar raíces de ecuaciones.

        El método de Broyden es una técnica cuasi-Newton que actualiza una aproximación
        de la matriz jacobiana en lugar de calcularla en cada iteración.

        Returns:
            BroydenResponse: Objeto con los resultados del método
        """
        x = self.x0
        iterations = 0
        all_iterations = []
        error = float('inf')

        try:
            # Evaluar la función en el punto inicial
            fx = self.equation_parser.evaluate(x)

            # Inicializar la aproximación de la matriz jacobiana (en 1D es un escalar)
            # Usamos la derivada exacta para la primera iteración
            B = self.equation_parser.evaluate_derivative(x)

            # Si la aproximación inicial de la jacobiana es cercana a cero, ajustarla
            if abs(B) < 1e-10:
                B = 1.0 if B >= 0 else -1.0

            while iterations < self.max_iterations and error > self.tolerance:
                # Verificar si B es cercano a cero para evitar división por cero
                if abs(B) < 1e-10:
                    return BroydenResponse(
                        root=None,
                        iterations=iterations,
                        convergence=False,
                        error=None,
                        all_iterations=all_iterations,
                        message="La aproximación de la jacobiana es cercana a cero. El método no puede continuar."
                    )

                # Calcular el paso
                s = -fx / B

                # Calcular el siguiente valor de x
                x_next = x + s

                # Evaluar la función en el nuevo punto
                fx_next = self.equation_parser.evaluate(x_next)

                # Calcular el cambio en la función
                y = fx_next - fx

                # Actualizar la aproximación de la jacobiana usando la fórmula de Broyden
                B = B + (y - B * s) / s

                # Calcular el error
                error = abs(s)

                # Guardar información de esta iteración
                iteration_info = self._create_iteration_info(iterations, x, fx, B, s, y, x_next, error)
                all_iterations.append(iteration_info)

                # Actualizar valores para la siguiente iteración
                x = x_next
                fx = fx_next
                iterations += 1

            # Verificar convergencia
            convergence = error <= self.tolerance

            # Crear y devolver la respuesta
            return self._create_response(x, iterations, convergence, error, all_iterations)

        except Exception as e:
            return BroydenResponse(
                root=None,
                iterations=iterations,
                convergence=False,
                error=None,
                all_iterations=all_iterations,
                message=f"Error durante la ejecución: {str(e)}"
            )