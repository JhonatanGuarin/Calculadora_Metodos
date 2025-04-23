import numpy as np
import sympy as sp
from typing import Tuple, List
from ..models import IterationResult
from ..utils.equation_parser import parse_equation

class PuntoFijoService:
    @staticmethod
    def solve(g_function: str, initial_x: float, tolerance: float, max_iterations: int) -> Tuple[float, List[IterationResult], bool, str]:
        """
        Implementa el método de punto fijo para encontrar raíces de ecuaciones.

        Args:
            g_function: La función g(x) en formato string
            initial_x: Valor inicial de x
            tolerance: Tolerancia para la convergencia
            max_iterations: Número máximo de iteraciones

        Returns:
            Tuple con (raíz, lista de iteraciones, convergencia, mensaje)
        """
        try:
            # Usar el parser mejorado para convertir la función string a una función evaluable
            # La función g(x) puede no contener x (ser constante)
            g = parse_equation(g_function, require_x=False)

            # Inicializar variables
            x_current = initial_x
            iterations = []

            for i in range(max_iterations):
                try:
                    # Calcular el siguiente valor de x
                    x_next = g(x_current)

                    # Verificar si el resultado es válido
                    if np.isnan(x_next) or np.isinf(x_next):
                        return None, iterations, False, f"La iteración {i+1} produjo un valor no válido (NaN o infinito). Verifique la función g(x) y el valor inicial."

                    # Calcular el error
                    error = abs(x_next - x_current)

                    # Guardar la iteración
                    iterations.append(IterationResult(
                        iteration=i+1,
                        x_value=float(x_next),
                        error=float(error)
                    ))

                    # Verificar convergencia
                    if error < tolerance:
                        return float(x_next), iterations, True, f"Convergencia alcanzada en {i+1} iteraciones"

                    # Actualizar x para la siguiente iteración
                    x_current = x_next

                except Exception as e:
                    return None, iterations, False, f"Error en la iteración {i+1}: {str(e)}"

            # Si llegamos aquí, no convergió en el número máximo de iteraciones
            return float(x_current), iterations, False, f"No se alcanzó la convergencia después de {max_iterations} iteraciones"

        except Exception as e:
            return None, [], False, f"Error al resolver: {str(e)}"