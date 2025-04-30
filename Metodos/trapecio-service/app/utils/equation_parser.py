import sympy as sp
import numpy as np
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
import re

def validate_equation(equation_str: str, require_x: bool = True) -> bool:
    """
    Valida si una ecuación es sintácticamente correcta.

    Args:
        equation_str: La ecuación en formato string
        require_x: Si es True, verifica que la ecuación contenga la variable 'x'

    Returns:
        True si la ecuación es válida, False en caso contrario
    """
    try:
        parse_equation(equation_str, require_x=require_x)
        return True
    except Exception:
        return False

def parse_equation(equation_str: str, require_x: bool = True):
    """
    Convierte una cadena de texto que representa una función en una función evaluable.
    Incluye validaciones exhaustivas para prevenir errores comunes.

    Args:
        equation_str: String que representa la función (ej: "x**2 + 1", "sin(x)")
        require_x: Si es True, verifica que la ecuación contenga la variable 'x'

    Returns:
        Una función que toma un valor x y devuelve el resultado de evaluar la función
    """
    try:
        # Verificar si la ecuación está vacía
        if not equation_str or equation_str.isspace():
            raise ValueError("La función no puede estar vacía")

        # Verificar si la ecuación contiene la variable x (solo si se requiere)
        if require_x and 'x' not in equation_str:
            raise ValueError("La función debe contener la variable 'x'")

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
                raise ValueError(f"La función contiene la variable '{var}' que no es válida. Solo se permite usar 'x' como variable.")
            else:
                vars_str = ", ".join(f"'{v}'" for v in unique_vars)
                raise ValueError(f"La función contiene variables no permitidas: {vars_str}. Solo se permite usar 'x' como variable.")

        # Verificar si la ecuación contiene caracteres no permitidos
        if ',' in equation_str:
            raise ValueError("La función contiene comas (,). Use punto (.) para decimales y evite las comas como separadores.")

        # Verificar otros caracteres potencialmente problemáticos
        # Permitimos caracteres alfanuméricos, operadores básicos, paréntesis, punto decimal y espacios
        invalid_chars = re.findall(r'[^\w\s\+\-\*\/\^\(\)\.\d]', equation_str.replace('**', '^'))
        if invalid_chars:
            unique_invalid = set(invalid_chars)
            raise ValueError(f"La función contiene caracteres no permitidos: {', '.join(unique_invalid)}")

        # Verificar paréntesis balanceados
        if equation_str.count('(') != equation_str.count(')'):
            raise ValueError("La función tiene paréntesis desbalanceados. Verifique que cada paréntesis de apertura tenga su correspondiente paréntesis de cierre.")

        # Configurar transformaciones para hacer el parsing más flexible
        transformations = standard_transformations + (implicit_multiplication_application,)

        # Intentar parsear la expresión
        x = sp.Symbol('x')
        try:
            # Asegurarse de que SymPy reconozca 'E' como la constante de Euler
            equation = parse_expr(equation_str, transformations=transformations, local_dict={'E': sp.E, 'exp': sp.exp})
        except SyntaxError:
            raise ValueError("Error de sintaxis: la función tiene una estructura matemática incorrecta. Verifique operadores y paréntesis.")
        except Exception as e:
            error_msg = str(e)
            # Mejorar mensajes de error comunes
            if "unexpected character" in error_msg:
                raise ValueError(f"Error de sintaxis: carácter inesperado en la función. {error_msg}")
            elif "parsing failed" in error_msg:
                raise ValueError(f"Error de sintaxis: la función no puede ser interpretada. {error_msg}")
            elif "not supported" in error_msg:
                raise ValueError(f"Error de sintaxis: operación no soportada en la función. {error_msg}")
            else:
                raise ValueError(f"Error de sintaxis en la función: {error_msg}")

        # Convertir la expresión simbólica a una función numérica
        try:
            # Usar módulos específicos para asegurar que exp y E estén disponibles
            func = sp.lambdify(x, equation, modules=['numpy', {'E': np.e, 'exp': np.exp}])

            # Probar la función con valores en el rango típico para verificar que es evaluable
            test_values = [-10.0, -1.0, 0.0, 1.0, 10.0]
            for test_val in test_values:
                try:
                    test_result = func(test_val)

                    # Verificar si el resultado es un número válido
                    if isinstance(test_result, complex) or (isinstance(test_result, np.ndarray) and np.iscomplexobj(test_result)):
                        # No lanzamos error aquí, solo advertimos sobre posibles valores complejos
                        pass

                    # Verificar si el resultado es una tupla (posiblemente debido a comas en la ecuación)
                    if isinstance(test_result, tuple):
                        raise ValueError("La función contiene comas (,) que están siendo interpretadas como separadores. Use punto (.) para decimales.")

                except TypeError as e:
                    if "must be real number, not tuple" in str(e):
                        raise ValueError("Error en la función: se detectó una coma (,) que está siendo interpretada como separador de tupla. Use punto (.) para decimales.")
                    else:
                        # No lanzamos error aquí, la función podría no estar definida en todos los puntos de prueba
                        pass
                except Exception:
                    # No lanzamos error aquí, la función podría no estar definida en todos los puntos de prueba
                    pass

            # Crear una función wrapper que maneje errores de evaluación
            def safe_func(x_val):
                try:
                    result = func(x_val)

                    # Verificar si el resultado es una tupla (posiblemente debido a comas en la ecuación)
                    if isinstance(result, tuple):
                        raise ValueError("La función contiene comas (,) que están siendo interpretadas como separadores. Use punto (.) para decimales.")

                    # Convertir valores complejos a NaN para que sean manejados adecuadamente
                    if isinstance(result, complex) or (isinstance(result, np.ndarray) and np.iscomplexobj(result)):
                        return np.nan

                    return result

                except TypeError as e:
                    if "must be real number, not tuple" in str(e):
                        raise ValueError("Error en la función: se detectó una coma (,) que está siendo interpretada como separador de tupla. Use punto (.) para decimales.")
                    else:
                        raise ValueError(f"Error al evaluar la función en x={x_val}: {str(e)}")
                except NameError as e:
                    # Capturar errores de nombres no definidos (variables adicionales)
                    var_name = str(e).split("'")[1] if "'" in str(e) else "desconocida"
                    raise ValueError(f"La función contiene la variable '{var_name}' que no está definida. Solo se permite usar 'x' como variable.")
                except ZeroDivisionError:
                    # Para integración, devolvemos NaN en lugar de lanzar error
                    return np.nan
                except Exception as e:
                    raise ValueError(f"Error al evaluar la función en x={x_val}: {str(e)}")

            return safe_func

        except Exception as e:
            raise ValueError(f"No se pudo convertir la función a una función evaluable: {str(e)}")

    except ValueError as e:
        # Re-lanzar errores de valor con el mensaje original
        raise ValueError(str(e))
    except Exception as e:
        # Capturar cualquier otro error y proporcionar un mensaje claro
        raise ValueError(f"Error inesperado al procesar la función: {str(e)}")

def check_continuity(equation_str: str, a: float, b: float, num_points: int = 100) -> bool:
    """
    Verifica si una función parece ser continua en un intervalo dado.

    Args:
        equation_str: La función en formato string
        a: Límite inferior del intervalo
        b: Límite superior del intervalo
        num_points: Número de puntos a evaluar

    Returns:
        True si la función parece ser continua, False en caso contrario
    """
    try:
        f = parse_equation(equation_str)

        # Evaluar la función en varios puntos del intervalo
        x_values = np.linspace(a, b, num_points)
        y_values = [f(x) for x in x_values]

        # Verificar si hay valores NaN o infinitos
        if any(np.isnan(y) or np.isinf(y) for y in y_values):
            return False

        return True
    except Exception:
        return False

def estimate_error(equation_str: str, a: float, b: float, n: int) -> float:
    """
    Estima el error de la aproximación del método del trapecio.

    Args:
        equation_str: La función en formato string
        a: Límite inferior de integración
        b: Límite superior de integración
        n: Número de subintervalos

    Returns:
        Una estimación del error o None si no se puede calcular
    """
    try:
        # Calcular la segunda derivada simbólicamente
        x = sp.Symbol('x')
        transformations = standard_transformations + (implicit_multiplication_application,)
        expr = parse_expr(equation_str, transformations=transformations, local_dict={'E': sp.E, 'exp': sp.exp})

        # Segunda derivada
        f_prime_prime = sp.diff(expr, x, 2)

        # Convertir a función numérica
        f_pp = sp.lambdify(x, f_prime_prime, modules=['numpy', {'E': np.e, 'exp': np.exp}])

        # Estimar el máximo de |f''(x)| en [a,b]
        x_values = np.linspace(a, b, 1000)
        try:
            y_values = [abs(f_pp(x)) for x in x_values]
            max_f_pp = max((y for y in y_values if not np.isnan(y) and not np.isinf(y)), default=None)

            if max_f_pp is not None:
                # Fórmula del error para el método del trapecio
                h = (b - a) / n
                error = (b - a)**3 * max_f_pp / (12 * n**2)
                return error
        except Exception:
            pass

        return None
    except Exception:
        return None