import numpy as np
from typing import Tuple, List
from ..models import SubintervalResult
from ..utils.equation_parser import parse_equation

class SimpsonService:
    @staticmethod
    def integrate(equation: str, a: float, b: float, n: int) -> Tuple[float, List[SubintervalResult], bool, str]:
        """
        Implementa el método de Simpson para integración numérica.

        Args:
            equation: La función a integrar en formato string
            a: Límite inferior de integración
            b: Límite superior de integración
            n: Número de subintervalos (debe ser par)

        Returns:
            Tuple con (valor de la integral, lista de subintervalos, éxito, mensaje)
        """
        try:
            # Verificar que n sea par
            if n % 2 != 0:
                return None, [], False, "El número de subintervalos debe ser par para el método de Simpson"

            # Convertir la ecuación a una función evaluable
            f = parse_equation(equation, require_x=True)

            # Calcular el ancho de cada subintervalo
            h = (b - a) / n

            # Inicializar variables
            integral = 0.0
            subintervals = []
            x_values = np.linspace(a, b, n + 1)

            # Evaluar la función en todos los puntos
            y_values = []
            for i, x in enumerate(x_values):
                try:
                    y = f(x)

                    # Verificar si los resultados son válidos
                    if np.isnan(y) or np.isinf(y):
                        return None, subintervals, False, f"La función produce valores no válidos (NaN o infinito) en x={x}"

                    y_values.append(y)

                    # Determinar el coeficiente según la regla de Simpson
                    if i == 0 or i == n:
                        coefficient = 1
                    elif i % 2 == 0:  # Puntos pares (excepto extremos)
                        coefficient = 2
                    else:  # Puntos impares
                        coefficient = 4

                    weighted_value = coefficient * y

                    # Guardar información del punto
                    subintervals.append(SubintervalResult(
                        index=i,
                        x_value=float(x),
                        y_value=float(y),
                        coefficient=coefficient,
                        weighted_value=float(weighted_value)
                    ))

                except Exception as e:
                    return None, subintervals, False, f"Error al evaluar la función en x={x}: {str(e)}"

            # Aplicar la fórmula de Simpson
            # ∫f(x)dx ≈ (h/3) * [f(x₀) + 4f(x₁) + 2f(x₂) + 4f(x₃) + ... + 2f(xₙ₋₂) + 4f(xₙ₋₁) + f(xₙ)]
            sum_values = y_values[0] + y_values[-1]  # Primero y último con coef 1

            for i in range(1, n):
                if i % 2 == 1:  # Índices impares
                    sum_values += 4 * y_values[i]
                else:  # Índices pares (excepto extremos)
                    sum_values += 2 * y_values[i]

            integral = (h / 3) * sum_values

            return float(integral), subintervals, True, f"Integración exitosa utilizando el método de Simpson con {n} subintervalos"

        except Exception as e:
            return None, [], False, f"Error al realizar la integración: {str(e)}"