import sympy as sp
import numpy as np
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
from fastapi import HTTPException
import re

def _preprocess_equation(equation_str):
    """Preprocesa la ecuación para manejar notaciones específicas"""
    # Verificar si la ecuación está vacía
    if not equation_str or equation_str.isspace():
        raise ValueError("La ecuación no puede estar vacía")

    # Verificar si la ecuación contiene las variables x e y
    if 'x' not in equation_str and 'y' not in equation_str:
        raise ValueError("La ecuación debe contener al menos una de las variables 'x' o 'y'")

    # Pre-procesamiento para manejar notaciones específicas
    # Reemplazar e^x por exp(x) y otras expresiones con la constante de Euler
    equation_str = equation_str.replace('e^x', 'exp(x)')
    equation_str = equation_str.replace('e^y', 'exp(y)')
    equation_str = equation_str.replace('e^(', 'exp(')

    # Reemplazar patrones como e^2x por exp(2*x)
    equation_str = re.sub(r'e\^(\d+)x', r'exp(\1*x)', equation_str)
    equation_str = re.sub(r'e\^(\d+)y', r'exp(\1*y)', equation_str)

    # Reemplazar math.e por E (constante de Euler en SymPy)
    equation_str = equation_str.replace('math.e', 'E')

    # Manejar 'e' aislada como la constante de Euler
    # Pero solo si es la letra 'e' sola, no como parte de otra palabra
    equation_str = re.sub(r'\b(e)\b', 'E', equation_str)

    return equation_str

def _validate_differential_equation_syntax(equation_str):
    """Valida la sintaxis de la ecuación diferencial"""
    # Verificar si hay otras variables además de 'x' e 'y'
    # Primero eliminamos funciones matemáticas comunes para no confundirlas con variables
    temp_eq = equation_str
    for func in ['sin', 'cos', 'tan', 'exp', 'log', 'ln', 'sqrt', 'abs', 'asin', 'acos', 'atan', 'pow']:
        temp_eq = temp_eq.replace(func, '')

    # También eliminamos E (constante de Euler) para no confundirla con una variable
    temp_eq = re.sub(r'\bE\b', '', temp_eq)

    # Buscar posibles variables (letras que no sean 'x' o 'y')
    other_vars = re.findall(r'[a-wz]', temp_eq.replace('x', '').replace('y', ''), re.IGNORECASE)
    if other_vars:
        unique_vars = set([v.lower() for v in other_vars])
        if len(unique_vars) == 1:
            var = list(unique_vars)[0]
            raise ValueError(f"La ecuación contiene la variable '{var}' que no es válida. Solo se permite usar 'x' e 'y' como variables.")
        else:
            vars_str = ", ".join(f"'{v}'" for v in unique_vars)
            raise ValueError(f"La ecuación contiene variables no permitidas: {vars_str}. Solo se permite usar 'x' e 'y' como variables.")

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

def _create_safe_differential_function(func):
    """Crea una función wrapper que maneja errores de evaluación"""
    def safe_func(x_val, y_val):
        try:
            result = func(x_val, y_val)

            # Verificar si el resultado es un número válido
            if isinstance(result, complex) or (isinstance(result, np.ndarray) and np.iscomplexobj(result)):
                raise ValueError(f"La ecuación produce valores complejos para x={x_val}, y={y_val}. Verifique que la ecuación sea real para los valores del intervalo.")

            # Verificar si el resultado es una tupla (posiblemente debido a comas en la ecuación)
            if isinstance(result, tuple):
                raise ValueError("La ecuación contiene comas (,) que están siendo interpretadas como separadores. Use punto (.) para decimales.")

            # Verificar si el resultado es NaN o infinito
            if np.isnan(result) or np.isinf(result):
                raise ValueError(f"La ecuación produce un valor no válido (NaN o infinito) para x={x_val}, y={y_val}. Verifique posibles divisiones por cero u operaciones indefinidas.")

            return result

        except TypeError as e:
            if "must be real number, not tuple" in str(e):
                raise ValueError("Error en la ecuación: se detectó una coma (,) que está siendo interpretada como separador de tupla. Use punto (.) para decimales.")
            else:
                raise ValueError(f"Error al evaluar la ecuación en x={x_val}, y={y_val}: {str(e)}")
        except NameError as e:
            # Capturar errores de nombres no definidos (variables adicionales)
            var_name = str(e).split("'")[1] if "'" in str(e) else "desconocida"
            raise ValueError(f"La ecuación contiene la variable '{var_name}' que no está definida. Solo se permite usar 'x' e 'y' como variables.")
        except ZeroDivisionError:
            raise ValueError(f"División por cero al evaluar la ecuación en x={x_val}, y={y_val}. Verifique denominadores que se anulan en este punto.")
        except Exception as e:
            raise ValueError(f"Error al evaluar la ecuación en x={x_val}, y={y_val}: {str(e)}")

    return safe_func

def parse_differential_equation(equation_str: str):
    """
    Convierte una cadena de texto que representa una ecuación diferencial en una función evaluable.

    Args:
        equation_str: String que representa la ecuación diferencial dy/dx = f(x,y)

    Returns:
        Una función que toma valores x e y y devuelve el resultado de evaluar la ecuación
    """
    try:
        # Preprocesar la ecuación
        equation_str = _preprocess_equation(equation_str)

        # Validar la sintaxis
        _validate_differential_equation_syntax(equation_str)

        # Configurar transformaciones para hacer el parsing más flexible
        transformations = standard_transformations + (implicit_multiplication_application,)

        # Intentar parsear la expresión
        x, y = sp.symbols('x y')
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

        # Convertir la expresión simbólica a una función numérica
        try:
            # Usar módulos específicos para asegurar que exp y E estén disponibles
            func = sp.lambdify((x, y), equation, modules=['numpy', {'E': np.e, 'exp': np.exp}])

            # Probar la función con valores para verificar que es evaluable
            try:
                test_result = func(1.0, 1.0)

                # Verificar si el resultado es un número válido
                if isinstance(test_result, complex) or (isinstance(test_result, np.ndarray) and np.iscomplexobj(test_result)):
                    raise ValueError("La ecuación produce valores complejos para x=1, y=1. Verifique que la ecuación sea real para los valores del intervalo.")

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
                raise ValueError(f"La ecuación contiene la variable '{var_name}' que no está definida. Solo se permite usar 'x' e 'y' como variables.")
            except Exception as e:
                raise ValueError(f"Error al evaluar la ecuación con x=1, y=1: {str(e)}")

            # Crear una función wrapper que maneje errores de evaluación
            return _create_safe_differential_function(func)

        except Exception as e:
            raise ValueError(f"No se pudo convertir la ecuación a una función evaluable: {str(e)}")

    except ValueError as e:
        # Re-lanzar errores de valor con el mensaje original
        raise ValueError(str(e))
    except Exception as e:
        # Capturar cualquier otro error y proporcionar un mensaje claro
        raise ValueError(f"Error inesperado al procesar la ecuación: {str(e)}")