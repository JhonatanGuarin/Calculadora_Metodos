import numpy as np
from typing import Tuple, List
from ..models import SubintervalResult
from ..utils.equation_parser import parse_equation

class TrapecioService:
    @staticmethod
    def integrate(equation: str, a: float, b: float, n: int) -> Tuple[float, List[SubintervalResult], bool, str]:
        """
        Implementa el método del trapecio para integración numérica.

        Args:
            equation: La función a integrar en formato string
            a: Límite inferior de integración
            b: Límite superior de integración
            n: Número de subintervalos (trapecios)

        Returns:
            Tuple con (valor de la integral, lista de subintervalos, éxito, mensaje)
        """
        try:
            # Convertir la ecuación a una función evaluable
            f = parse_equation(equation, require_x=True)

            # Calcular el ancho de cada subintervalo
            h = (b - a) / n

            # Inicializar variables
            integral = 0.0
            subintervals = []
            x_values = np.linspace(a, b, n + 1)

            # Aplicar la regla del trapecio
            for i in range(n):
                x_left = x_values[i]
                x_right = x_values[i + 1]

                try:
                    y_left = f(x_left)
                    y_right = f(x_right)

                    # Verificar si los resultados son válidos
                    if np.isnan(y_left) or np.isinf(y_left) or np.isnan(y_right) or np.isinf(y_right):
                        return None, subintervals, False, f"La función produce valores no válidos (NaN o infinito) en el intervalo [{x_left}, {x_right}]"

                    # Calcular el área del trapecio
                    area = h * (y_left + y_right) / 2

                    # Acumular el área
                    integral += area

                    # Guardar información del subintervalo
                    subintervals.append(SubintervalResult(
                        index=i + 1,
                        x_value=float(x_right),
                        y_value=float(y_right),
                        area=float(area)
                    ))

                except Exception as e:
                    return None, subintervals, False, f"Error al evaluar la función en x={x_left} o x={x_right}: {str(e)}"

            return float(integral), subintervals, True, f"Integración exitosa utilizando {n} subintervalos"

        except Exception as e:
            return None, [], False, f"Error al realizar la integración: {str(e)}"