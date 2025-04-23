import numpy as np
from typing import List, Dict, Any, Union
from fastapi import HTTPException

class MatrixValidator:
    def __init__(self, A: List[List[float]], b: List[float], initial_guess: List[float] = None):
        """
        Inicializa el validador de matrices para el método de Jacobi.

        Args:
            A: Matriz de coeficientes
            b: Vector de términos independientes
            initial_guess: Vector inicial de aproximación (opcional)
        """
        self.A = np.array(A, dtype=float)
        self.b = np.array(b, dtype=float)
        self.initial_guess = np.array(initial_guess, dtype=float) if initial_guess is not None else None
        self.n = len(b)

        # Realizar validaciones básicas
        self._validate_dimensions()
        self._validate_matrix_properties()
        if initial_guess is not None:
            self._validate_initial_guess()

    def _validate_dimensions(self):
        """
        Valida las dimensiones de la matriz A y los vectores b e initial_guess.
        """
        try:
            # Verificar si la matriz A está vacía
            if len(self.A) == 0:
                raise ValueError("La matriz de coeficientes A no puede estar vacía")

            # Verificar si el vector b está vacío
            if len(self.b) == 0:
                raise ValueError("El vector de términos independientes b no puede estar vacío")

            # Verificar si A es una matriz cuadrada
            if not all(len(row) == self.n for row in self.A):
                raise ValueError("La matriz A debe ser cuadrada (mismo número de filas y columnas)")

            # Verificar si las dimensiones de A y b son compatibles
            if len(self.A) != len(self.b):
                raise ValueError(f"La dimensión de la matriz A ({len(self.A)}x{len(self.A[0])}) no es compatible con el vector b (longitud {len(self.b)})")

        except ValueError as e:
            # Re-lanzar errores de valor con el mensaje original
            raise ValueError(str(e))
        except Exception as e:
            # Capturar cualquier otro error y proporcionar un mensaje claro
            raise ValueError(f"Error inesperado al validar dimensiones: {str(e)}")

    def _validate_matrix_properties(self):
        """
        Valida propiedades específicas de la matriz para el método de Jacobi.
        """
        try:
            # Verificar si hay elementos diagonales nulos
            for i in range(self.n):
                if self.A[i, i] == 0:
                    raise ValueError(f"El elemento diagonal A[{i},{i}] es cero. El método de Jacobi requiere elementos diagonales no nulos.")

            # Verificar si hay elementos NaN o infinitos en la matriz A
            if np.any(np.isnan(self.A)) or np.any(np.isinf(self.A)):
                raise ValueError("La matriz A contiene valores no válidos (NaN o infinito)")

            # Verificar si hay elementos NaN o infinitos en el vector b
            if np.any(np.isnan(self.b)) or np.any(np.isinf(self.b)):
                raise ValueError("El vector b contiene valores no válidos (NaN o infinito)")

        except ValueError as e:
            # Re-lanzar errores de valor con el mensaje original
            raise ValueError(str(e))
        except Exception as e:
            # Capturar cualquier otro error y proporcionar un mensaje claro
            raise ValueError(f"Error inesperado al validar propiedades de la matriz: {str(e)}")

    def _validate_initial_guess(self):
        """
        Valida el vector de aproximación inicial.
        """
        try:
            # Verificar si las dimensiones del vector inicial son compatibles
            if len(self.initial_guess) != self.n:
                raise ValueError(f"La dimensión del vector inicial ({len(self.initial_guess)}) no coincide con la dimensión del sistema ({self.n})")

            # Verificar si hay elementos NaN o infinitos en el vector inicial
            if np.any(np.isnan(self.initial_guess)) or np.any(np.isinf(self.initial_guess)):
                raise ValueError("El vector inicial contiene valores no válidos (NaN o infinito)")

        except ValueError as e:
            # Re-lanzar errores de valor con el mensaje original
            raise ValueError(str(e))
        except Exception as e:
            # Capturar cualquier otro error y proporcionar un mensaje claro
            raise ValueError(f"Error inesperado al validar el vector inicial: {str(e)}")

    def check_convergence_conditions(self) -> Dict[str, Any]:
        """
        Verifica las condiciones de convergencia para el método de Jacobi.

        Returns:
            Diccionario con información sobre las condiciones de convergencia
        """
        result = {
            "will_converge": True,
            "is_diagonally_dominant": True,
            "spectral_radius": None,
            "warnings": [],
            "details": {}
        }

        try:
            # Verificar dominancia diagonal
            is_diag_dominant = True
            for i in range(self.n):
                diagonal = abs(self.A[i, i])
                sum_others = sum(abs(self.A[i, j]) for j in range(self.n) if j != i)

                if diagonal <= sum_others:
                    is_diag_dominant = False
                    result["warnings"].append(f"La fila {i+1} no cumple el criterio de dominancia diagonal: |{diagonal}| <= {sum_others}")

            result["is_diagonally_dominant"] = is_diag_dominant

            if not is_diag_dominant:
                result["warnings"].append("La matriz no es diagonalmente dominante. La convergencia del método de Jacobi no está garantizada.")
                result["will_converge"] = False

            # Calcular el radio espectral de la matriz de iteración de Jacobi
            try:
                D = np.diag(np.diag(self.A))
                D_inv = np.diag(1.0 / np.diag(self.A))
                R = np.eye(self.n) - np.dot(D_inv, self.A)

                # Calcular los valores propios
                eigenvalues = np.linalg.eigvals(R)
                spectral_radius = max(abs(eigenvalues))

                result["spectral_radius"] = float(spectral_radius)
                result["details"]["eigenvalues"] = eigenvalues.tolist()

                if spectral_radius >= 1:
                    result["warnings"].append(f"El radio espectral de la matriz de iteración es {spectral_radius:.4f} >= 1. El método de Jacobi no convergerá.")
                    result["will_converge"] = False
                else:
                    result["details"]["estimated_iterations"] = int(np.ceil(np.log(1e-6) / np.log(spectral_radius)))

            except np.linalg.LinAlgError:
                result["warnings"].append("No se pudo calcular el radio espectral. Posible problema numérico con la matriz.")

            # Verificar el condicionamiento de la matriz
            try:
                cond_number = np.linalg.cond(self.A)
                result["details"]["condition_number"] = float(cond_number)

                if cond_number > 1e6:
                    result["warnings"].append(f"La matriz está mal condicionada (número de condición: {cond_number:.2e}). Esto puede afectar la precisión de la solución.")
            except np.linalg.LinAlgError:
                result["warnings"].append("No se pudo calcular el número de condición. Posible problema numérico con la matriz.")

            return result

        except Exception as e:
            # Capturar cualquier error y proporcionar un mensaje claro
            result["warnings"].append(f"Error al verificar condiciones de convergencia: {str(e)}")
            result["will_converge"] = False
            return result

    def estimate_iterations(self, tolerance: float = 1e-6) -> int:
        """
        Estima el número de iteraciones necesarias para alcanzar la tolerancia especificada.

        Args:
            tolerance: Tolerancia deseada

        Returns:
            Número estimado de iteraciones
        """
        try:
            # Calcular la matriz de iteración de Jacobi
            D = np.diag(np.diag(self.A))
            D_inv = np.diag(1.0 / np.diag(self.A))
            R = np.eye(self.n) - np.dot(D_inv, self.A)

            # Calcular el radio espectral
            eigenvalues = np.linalg.eigvals(R)
            spectral_radius = max(abs(eigenvalues))

            if spectral_radius >= 1:
                return float('inf')  # No convergerá

            # Estimar el número de iteraciones
            # Fórmula: log(tol) / log(spectral_radius)
            iterations = np.ceil(np.log(tolerance) / np.log(spectral_radius))
            return int(iterations)

        except Exception as e:
            # En caso de error, devolver un valor predeterminado
            return 100  # Valor predeterminado

    def get_validation_summary(self) -> Dict[str, Any]:
        """
        Proporciona un resumen de todas las validaciones.

        Returns:
            Diccionario con el resumen de validaciones
        """
        summary = {
            "dimensions": {
                "matrix_size": f"{self.n}x{self.n}",
                "vector_size": self.n,
                "is_square": True
            },
            "matrix_properties": {
                "has_zero_diagonal": False,
                "contains_invalid_values": False
            },
            "convergence": self.check_convergence_conditions()
        }

        return summary