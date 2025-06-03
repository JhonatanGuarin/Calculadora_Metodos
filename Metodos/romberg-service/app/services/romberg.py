from ..models import RombergTableEntry
from ..utils.equation_parser import parse_equation
import numpy as np

class RombergService:
    @staticmethod
    def integrate(equation_str: str, a: float, b: float, n: int):
        """
        Implementa el método de integración de Romberg.

        Args:
            equation_str: La función a integrar en formato string
            a: Límite inferior de integración
            b: Límite superior de integración
            n: Número de iteraciones (niveles) para el método de Romberg

        Returns:
            Tupla con (valor de la integral, tabla de Romberg, éxito, mensaje)
        """
        try:
            # Parsear la ecuación
            f = parse_equation(equation_str)

            # Inicializar la tabla de Romberg (matriz R)
            R = np.zeros((n, n))
            table_entries = []

            # Calcular la primera aproximación usando la regla del trapecio
            h = b - a
            R[0, 0] = h * (f(a) + f(b)) / 2

            # Añadir el primer valor a la tabla
            table_entries.append(RombergTableEntry(i=0, j=0, value=float(R[0, 0])))

            # Calcular el resto de la tabla de Romberg
            for i in range(1, n):
                # Calcular la regla del trapecio con 2^i subintervalos
                h = h / 2
                sum_term = 0
                for k in range(1, 2**(i), 2):
                    sum_term += f(a + k * h)

                # Primera columna: refinamiento de la regla del trapecio
                R[i, 0] = R[i-1, 0] / 2 + h * sum_term
                table_entries.append(RombergTableEntry(i=i, j=0, value=float(R[i, 0])))

                # Aplicar extrapolación de Richardson para las columnas restantes
                for j in range(1, i+1):
                    R[i, j] = R[i, j-1] + (R[i, j-1] - R[i-1, j-1]) / (4**j - 1)
                    table_entries.append(RombergTableEntry(i=i, j=j, value=float(R[i, j])))

            # El resultado final es el valor en la esquina inferior derecha de la tabla
            result = R[n-1, n-1]

            # Verificar si el resultado es un número válido
            if np.isnan(result) or np.isinf(result):
                return None, table_entries, False, "La integración resultó en un valor no numérico (NaN o infinito)"

            return float(result), table_entries, True, "Integración exitosa"

        except Exception as e:
            return None, [], False, f"Error durante la integración: {str(e)}"