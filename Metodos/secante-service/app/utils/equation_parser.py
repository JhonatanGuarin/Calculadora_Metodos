import sympy as sp
import numpy as np
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
from fastapi import HTTPException
import re

class EquationParser:
    def __init__(self, equation_str: str):
        """
        Inicializa el parser de ecuaciones para el método de la Secante.

        Args:
            equation_str: String que representa la ecuación (ej: "x**2 - 4", "e^x - 3*x")
        """
        self.equation_str = equation_str
        self.x = sp.Symbol('x')
        self.equation = self._parse_equation(equation_str)

        # Convertir la expresión simbólica a una función numérica
        self.func = self._create_lambda_function(self.equation)

    def _parse_equation(self, equation_str: str):
        """
        Convierte una cadena de texto que representa una ecuación en una expresión simbólica.
        Realiza múltiples validaciones para evitar errores.

        Args:
            equation_str: String que representa la ecuación

        Returns:
            Una expresión simbólica de SymPy
        """
        try:
            # Verificar si la ecuación está vacía
            if not equation_str or equation_str.isspace():
                raise ValueError("La ecuación no puede estar vacía")

            # Verificar si la ecuación contiene la variable x
            if 'x' not in equation_str:
                raise ValueError("La ecuación debe contener la variable 'x'")

            # Pre-procesamiento para manejar notaciones específicas
            # Reemplazar e^x por exp(x) y otras expresiones con la constante de Euler
            equation_str = equation_str.replace('e^x', 'exp(x)')
            equation_str = equation_str.replace('e^(', 'exp(')

            # Reemplazar patrones como e^2x por exp(2*x)
            equation_str = re.sub(r'e\^(\d+)x', r'exp(\1*x)', equation_str)

            # Reemplazar math.e por E (constante de Euler en SymPy)
            equation_str = equation_str.replace('math.e', 'E')

            # Manejar 'e' aislada como la constante de Euler
            # Pero solo si es la letra 'e' sola, no como parte de otra palabra
            equation_str = re.sub(r'\b(e)\b', 'E', equation_str)

            # Verificar si hay otras variables además de 'x'
            # Primero eliminamos funciones matemáticas comunes para no confundirlas con variables
            temp_eq = equation_str
            for func in ['sin', 'cos', 'tan', 'exp', 'log', 'ln', 'sqrt', 'abs', 'asin', 'acos', 'atan']:
                temp_eq = temp_eq.replace(func, '')

            # También eliminamos E (constante de Euler) para no confundirla con una variable
            temp_eq = re.sub(r'\bE\b', '', temp_eq)

            # Buscar posibles variables (letras que no sean 'x')
            other_vars = re.findall(r'[a-wyz]', temp_eq, re.IGNORECASE)
            if other_vars:
                unique_vars = set([v.lower() for v in other_vars])
                if len(unique_vars) == 1:
                    var = list(unique_vars)[0]
                    raise ValueError(f"La ecuación contiene la variable '{var}' que no es válida. Solo se permite usar 'x' como variable.")
                else:
                    vars_str = ", ".join(f"'{v}'" for v in unique_vars)
                    raise ValueError(f"La ecuación contiene variables no permitidas: {vars_str}. Solo se permite usar 'x' como variable.")

            # Verificar si la ecuación contiene caracteres no permitidos
            if ',' in equation_str:
                raise ValueError("La ecuación contiene comas (,). Use punto (.) para decimales y evite las comas como separadores.")

            # Verificar otros caracteres potencialmente problemáticos
            # Permitimos caracteres alfanuméricos, operadores básicos, paréntesis, punto decimal y espacios
            invalid_chars = re.findall(r'[^\w\s\+\-\*\/\^\(\)\.\d]', equation_str.replace('**', '^'))
            if invalid_chars:
                unique_invalid = set(invalid_chars)
                raise ValueError(f"La ecuación contiene caracteres no permitidos: {', '.join(unique_invalid)}")

            # Verificar paréntesis balanceados
            if equation_str.count('(') != equation_str.count(')'):
                raise ValueError("La ecuación tiene paréntesis desbalanceados. Verifique que cada paréntesis de apertura tenga su correspondiente paréntesis de cierre.")

            # Configurar transformaciones para hacer el parsing más flexible
            transformations = standard_transformations + (implicit_multiplication_application,)

            # Intentar parsear la expresión
            try:
                # Asegurarse de que SymPy reconozca 'E' como la constante de Euler
                equation = parse_expr(equation_str, transformations=transformations, local_dict={'E': sp.E, 'exp': sp.exp})
            except SyntaxError:
                raise ValueError("Error de sintaxis: la ecuación tiene una estructura matemática incorrecta. Verifique operadores y paréntesis.")
            except Exception as e:
                error_msg = str(e)
                # Mejorar mensajes de error comunes
                if "unexpected character" in error_msg:
                    raise ValueError(f"Error de sintaxis: carácter inesperado en la ecuación. {error_msg}")
                elif "parsing failed" in error_msg:
                    raise ValueError(f"Error de sintaxis: la ecuación no puede ser interpretada. {error_msg}")
                elif "not supported" in error_msg:
                    raise ValueError(f"Error de sintaxis: operación no soportada en la ecuación. {error_msg}")
                else:
                    raise ValueError(f"Error de sintaxis en la ecuación: {error_msg}")

            # Verificar si la función es continua (para el método de la secante)
            try:
                # Probar la evaluación en algunos puntos para verificar continuidad
                test_values = [-1.0, 0.0, 1.0, 2.0]
                for val in test_values:
                    test_result = equation.subs(self.x, val)
                    if test_result.has(sp.oo) or test_result.has(-sp.oo):
                        raise ValueError(f"La función tiene una discontinuidad en x={val}. El método de la secante requiere una función continua en el intervalo de trabajo.")
            except Exception as e:
                if "cannot determine truth value" in str(e):
                    # Este error puede ocurrir con expresiones complejas pero válidas
                    pass
                elif "division by zero" in str(e).lower():
                    raise ValueError(f"La función tiene una división por cero. Verifique posibles discontinuidades en la función.")
                else:
                    # No lanzamos error aquí, ya que algunas funciones válidas pueden dar problemas en ciertos puntos
                    pass

            return equation

        except ValueError as e:
            # Re-lanzar errores de valor con el mensaje original
            raise ValueError(str(e))
        except Exception as e:
            # Capturar cualquier otro error y proporcionar un mensaje claro
            raise ValueError(f"Error inesperado al procesar la ecuación: {str(e)}")

    def _create_lambda_function(self, sympy_expr):
        """
        Convierte una expresión simbólica de SymPy en una función lambda segura.

        Args:
            sympy_expr: Expresión simbólica de SymPy

        Returns:
            Una función lambda que maneja errores de evaluación
        """
        try:
            # Convertir la expresión simbólica a una función numérica
            func = sp.lambdify(self.x, sympy_expr, modules=['numpy', {'E': np.e, 'exp': np.exp}])

            # Probar la función con un valor para verificar que es evaluable
            try:
                test_result = func(1.0)

                # Verificar si el resultado es un número válido
                if isinstance(test_result, complex) or (isinstance(test_result, np.ndarray) and np.iscomplexobj(test_result)):
                    raise ValueError("La ecuación produce valores complejos para x=1. Verifique que la ecuación sea real para los valores del intervalo.")

                # Verificar si el resultado es una tupla (posiblemente debido a comas en la ecuación)
                if isinstance(test_result, tuple):
                    raise ValueError("La ecuación contiene comas (,) que están siendo interpretadas como separadores. Use punto (.) para decimales.")

            except TypeError as e:
                if "must be real number, not tuple" in str(e):
                    raise ValueError("Error en la ecuación: se detectó una coma (,) que está siendo interpretada como separador de tupla. Use punto (.) para decimales.")
                else:
                    raise ValueError(f"Error al evaluar la ecuación: {str(e)}")
            except NameError as e:
                # Capturar errores de nombres no definidos (variables adicionales)
                var_name = str(e).split("'")[1] if "'" in str(e) else "desconocida"
                raise ValueError(f"La ecuación contiene la variable '{var_name}' que no está definida. Solo se permite usar 'x' como variable.")
            except Exception as e:
                raise ValueError(f"Error al evaluar la ecuación con x=1: {str(e)}")

            # Crear una función wrapper que maneje errores de evaluación
            def safe_func(x_val):
                try:
                    result = func(x_val)

                    # Verificar si el resultado es un número válido
                    if isinstance(result, complex) or (isinstance(result, np.ndarray) and np.iscomplexobj(result)):
                        raise ValueError(f"La ecuación produce valores complejos para x={x_val}. Verifique que la ecuación sea real para los valores del intervalo.")

                    # Verificar si el resultado es una tupla (posiblemente debido a comas en la ecuación)
                    if isinstance(result, tuple):
                        raise ValueError("La ecuación contiene comas (,) que están siendo interpretadas como separadores. Use punto (.) para decimales.")

                    # Verificar si el resultado es NaN o infinito
                    if np.isnan(result) or np.isinf(result):
                        raise ValueError(f"La ecuación produce un valor no válido (NaN o infinito) para x={x_val}. Verifique posibles divisiones por cero u operaciones indefinidas.")

                    return result

                except TypeError as e:
                    if "must be real number, not tuple" in str(e):
                        raise ValueError("Error en la ecuación: se detectó una coma (,) que está siendo interpretada como separador de tupla. Use punto (.) para decimales.")
                    else:
                        raise ValueError(f"Error al evaluar la ecuación en x={x_val}: {str(e)}")
                except NameError as e:
                    # Capturar errores de nombres no definidos (variables adicionales)
                    var_name = str(e).split("'")[1] if "'" in str(e) else "desconocida"
                    raise ValueError(f"La ecuación contiene la variable '{var_name}' que no está definida. Solo se permite usar 'x' como variable.")
                except ZeroDivisionError:
                    raise ValueError(f"División por cero al evaluar la ecuación en x={x_val}. Verifique denominadores que se anulan en este punto.")
                except Exception as e:
                    raise ValueError(f"Error al evaluar la ecuación en x={x_val}: {str(e)}")

            return safe_func

        except Exception as e:
            raise ValueError(f"No se pudo convertir la ecuación a una función evaluable: {str(e)}")

    def evaluate(self, x_value: float) -> float:
        """Evalúa la función en un punto dado."""
        return self.func(x_value)

    def get_function_expression(self) -> str:
        """Retorna la expresión de la función como string."""
        return str(self.equation)

    def validate_initial_points(self, x0: float, x1: float):
        """
        Valida los puntos iniciales para el método de la secante.

        Args:
            x0: Primera aproximación inicial
            x1: Segunda aproximación inicial

        Raises:
            ValueError: Si los puntos iniciales no son adecuados
        """
        try:
            # Evaluar la función en los puntos iniciales
            f_x0 = self.evaluate(x0)
            f_x1 = self.evaluate(x1)

            # Verificar si los puntos son iguales
            if x0 == x1:
                raise ValueError("Los puntos iniciales x0 y x1 no pueden ser iguales.")

            # Verificar si la función tiene el mismo valor en ambos puntos
            if abs(f_x0 - f_x1) < 1e-10:
                raise ValueError(f"La función tiene valores muy similares en x0={x0} y x1={x1}. Esto puede causar problemas de convergencia en el método de la secante.")

            # Verificar si hay un cambio de signo (no es estrictamente necesario para la secante, pero es útil)
            if f_x0 * f_x1 < 0:
                # Esto es bueno, hay un cambio de signo
                pass

        except ValueError as e:
            # Re-lanzar errores de valor
            raise ValueError(str(e))
        except Exception as e:
            # Capturar cualquier otro error
            raise ValueError(f"Error al validar los puntos iniciales: {str(e)}")