import React, { useState } from 'react';
import { addStyles, EditableMathField } from 'react-mathquill';
import '../styles/MathKeyboard.css';

// Inicializar MathQuill
addStyles();

const MathKeyboard = ({ onChange, initialValue = '' }) => {
  const [mathField, setMathField] = useState(null);
  const [latexValue, setLatexValue] = useState(initialValue);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const handleMathFieldChange = (mathField) => {
    const latex = mathField.latex();
    setLatexValue(latex);
    
    // Convertir LaTeX a formato que pueda ser evaluado por el backend
    const evaluableExpression = convertLatexToEvaluable(latex);
    onChange(evaluableExpression);
  };

  // Función mejorada para convertir LaTeX a una expresión evaluable
  const convertLatexToEvaluable = (latex) => {
    if (!latex) return '';
    
    let expr = latex;
    
    // Reemplazar operadores y funciones de LaTeX a formato Python
    expr = expr.replace(/\\cdot/g, '*');
    expr = expr.replace(/\\times/g, '*');
    expr = expr.replace(/\\div/g, '/');
    
    // Fracciones
    expr = expr.replace(/\\frac{([^}]*)}{([^}]*)}/g, '($1)/($2)');
    
    // Raíces
    expr = expr.replace(/\\sqrt{([^}]*)}/g, 'sqrt($1)');
    // Reemplazar raíces cúbicas y superiores correctamente
    expr = expr.replace(/\\sqrt\[(\d+)\]{([^}]*)}/g, '($2)**(1/$1)');

    
    // Funciones trigonométricas
    expr = expr.replace(/\\sin/g, 'sin');
    expr = expr.replace(/\\cos/g, 'cos');
    expr = expr.replace(/\\tan/g, 'tan');
    expr = expr.replace(/\\cot/g, '1/tan');
    expr = expr.replace(/\\sec/g, '1/cos');
    expr = expr.replace(/\\csc/g, '1/sin');
    
    // Logaritmos
    expr = expr.replace(/\\log_\{10\}/g, 'log10');
    expr = expr.replace(/\\log/g, 'log10');
    expr = expr.replace(/\\ln/g, 'log');
    
    // Constantes
    expr = expr.replace(/\\pi/g, 'pi');
    expr = expr.replace(/\\infty/g, 'inf');
    
    // Potencias
    expr = expr.replace(/\^{([^}]*)}/g, '**($1)');
    expr = expr.replace(/\^(\d+)/g, '**$1');
    
    // Paréntesis
    expr = expr.replace(/\\left\(/g, '(');
    expr = expr.replace(/\\right\)/g, ')');
    
    // Reemplazar x^2 por x**2
    expr = expr.replace(/x\^2/g, 'x**2');
    expr = expr.replace(/x\^3/g, 'x**3');
    
    // Manejar la constante de Euler (e)
    // Primero, reemplazar e^x por exp(x)
    expr = expr.replace(/e\^{([^}]*)}/g, 'exp($1)');
    expr = expr.replace(/e\^(\w)/g, 'exp($1)');
    
    // Caso especial: e^x
    expr = expr.replace(/e\^x/g, 'exp(x)');
    
    // Asegurarse de que e aislada se interprete como la constante de Euler
    // Pero solo si es la letra 'e' sola, no como parte de otra palabra
    expr = expr.replace(/\b(e)\b/g, 'math.e');
    
    // Limpiar espacios
    expr = expr.replace(/\s+/g, '');
    
    // Lista de funciones matemáticas comunes
    const mathFunctions = [
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
      'sqrt', 'log', 'log10', 'exp', 'pow'
    ];
    
    // Corregir el problema de asteriscos entre funciones y paréntesis
    mathFunctions.forEach(func => {
      const pattern = new RegExp(`${func}\\*\\(`, 'g');
      expr = expr.replace(pattern, `${func}(`);
    });
    
    // Asegurarse de que las operaciones con exp() estén correctas
    expr = expr.replace(/exp\*\(/g, 'exp(');
    
    // Asegurarse de que las multiplicaciones con variables sean explícitas
    expr = expr.replace(/(\d)([a-zA-Z])/g, '$1*$2');
    
    console.log('LaTeX original:', latex);
    console.log('Expresión convertida:', expr);
    
    return expr;
  };

  // IMPORTANTE: Prevenir el envío del formulario al hacer clic en los botones
  const insertSymbol = (symbol, e) => {
    // Prevenir el comportamiento predeterminado (envío del formulario)
    if (e) e.preventDefault();
    
    if (mathField) {
      mathField.write(symbol);
      mathField.focus();
    }
  };

  const toggleKeyboard = (e) => {
    // Prevenir el comportamiento predeterminado
    if (e) e.preventDefault();
    setShowKeyboard(!showKeyboard);
  };

  // Definir categorías y teclas para el teclado científico
  const keyboardCategories = [
    {
      name: "Básico",
      keys: [
        { label: "7", value: "7" },
        { label: "8", value: "8" },
        { label: "9", value: "9" },
        { label: "÷", value: "\\div" },
        { label: "(", value: "(" },
        { label: ")", value: ")" },
        { label: "4", value: "4" },
        { label: "5", value: "5" },
        { label: "6", value: "6" },
        { label: "×", value: "\\cdot" },
        { label: "[", value: "[" },
        { label: "]", value: "]" },
        { label: "1", value: "1" },
        { label: "2", value: "2" },
        { label: "3", value: "3" },
        { label: "-", value: "-" },
        { label: "{", value: "\\{" },
        { label: "}", value: "\\}" },
        { label: "0", value: "0" },
        { label: ".", value: "." },
        { label: "π", value: "\\pi" },
        { label: "+", value: "+" },
        { label: "=", value: "=" },
        { label: "≠", value: "\\neq" }
      ]
    },
    {
      name: "Funciones",
      keys: [
        { label: "x²", value: "x^2" },
        { label: "x³", value: "x^3" },
        { label: "x^n", value: "x^{}" },
        { label: "e^x", value: "e^{x}" },
        { label: "10^x", value: "10^{x}" },
        { label: "√", value: "\\sqrt{}" },
        { label: "∛", value: "\\sqrt[3]{}" },
        { label: "ⁿ√", value: "\\sqrt[n]{}" },
        { label: "log", value: "\\log_{}" },
        { label: "ln", value: "\\ln" },
        { label: "log₁₀", value: "\\log_{10}" },
        { label: "|x|", value: "|x|" }
      ]
    },
    {
      name: "Trigonometría",
      keys: [
        { label: "sin", value: "\\sin" },
        { label: "cos", value: "\\cos" },
        { label: "tan", value: "\\tan" },
        { label: "csc", value: "\\csc" },
        { label: "sec", value: "\\sec" },
        { label: "cot", value: "\\cot" },
        { label: "sin⁻¹", value: "\\sin^{-1}" },
        { label: "cos⁻¹", value: "\\cos^{-1}" },
        { label: "tan⁻¹", value: "\\tan^{-1}" },
        { label: "sinh", value: "\\sinh" },
        { label: "cosh", value: "\\cosh" },
        { label: "tanh", value: "\\tanh" }
      ]
    },
    {
      name: "Fracciones",
      keys: [
        { label: "a/b", value: "\\frac{}{}" },
        { label: "∂/∂x", value: "\\frac{\\partial}{\\partial x}" },
        { label: "dx/dy", value: "\\frac{dx}{dy}" },
        { label: "d/dx", value: "\\frac{d}{dx}" },
        { label: "d²/dx²", value: "\\frac{d^2}{dx^2}" },
        { label: "∫", value: "\\int" },
        { label: "∫_a^b", value: "\\int_{a}^{b}" },
        { label: "∑", value: "\\sum_{i=1}^{n}" },
        { label: "∏", value: "\\prod_{i=1}^{n}" },
        { label: "lim", value: "\\lim_{x \\to }" }
      ]
    },
    {
      name: "Símbolos",
      keys: [
        { label: "x", value: "x" },
        { label: "y", value: "y" },
        { label: "z", value: "z" },
        { label: "θ", value: "\\theta" },
        { label: "α", value: "\\alpha" },
        { label: "β", value: "\\beta" },
        { label: "γ", value: "\\gamma" },
        { label: "δ", value: "\\delta" },
        { label: "ε", value: "\\epsilon" },
        { label: "λ", value: "\\lambda" },
        { label: "μ", value: "\\mu" },
        { label: "σ", value: "\\sigma" },
        { label: "∞", value: "\\infty" }
      ]
    },
    {
      name: "Operadores",
      keys: [
        { label: "≤", value: "\\leq" },
        { label: "≥", value: "\\geq" },
        { label: "<", value: "<" },
        { label: ">", value: ">" },
        { label: "±", value: "\\pm" },
        { label: "∓", value: "\\mp" },
        { label: "≈", value: "\\approx" },
        { label: "∝", value: "\\propto" },
        { label: "≡", value: "\\equiv" },
        { label: "→", value: "\\rightarrow" },
        { label: "←", value: "\\leftarrow" },
        { label: "↔", value: "\\leftrightarrow" }
      ]
    }
  ];

  const [activeCategory, setActiveCategory] = useState(keyboardCategories[0].name);

  return (
    <div className="math-keyboard-container">
      <div className="math-input-field">
        <EditableMathField
          latex={latexValue}
          onChange={(mathField) => handleMathFieldChange(mathField)}
          mathquillDidMount={(mathField) => setMathField(mathField)}
        />
        <button 
          type="button" // Especificar explícitamente que es un botón de tipo "button"
          className="keyboard-toggle"
          onClick={toggleKeyboard}
        >
          {showKeyboard ? '▲' : '▼'}
        </button>
      </div>
      
      {showKeyboard && (
        <div className="math-keyboard">
          <div className="keyboard-categories">
            {keyboardCategories.map((category) => (
              <button
                key={category.name}
                type="button" // Especificar explícitamente que es un botón de tipo "button"
                className={`category-button ${activeCategory === category.name ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault(); // Prevenir el envío del formulario
                  setActiveCategory(category.name);
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
          
          <div className="keyboard-keys">
            {keyboardCategories.find(cat => cat.name === activeCategory).keys.map((key, index) => (
              <button
                key={index}
                type="button" // Especificar explícitamente que es un botón de tipo "button"
                className="keyboard-key"
                onClick={(e) => insertSymbol(key.value, e)}
              >
                {key.label}
              </button>
            ))}
          </div>
          
          <div className="keyboard-actions">
            <button 
              type="button" // Especificar explícitamente que es un botón de tipo "button"
              className="keyboard-action clear"
              onClick={(e) => {
                e.preventDefault(); // Prevenir el envío del formulario
                if (mathField) {
                  mathField.latex('');
                  onChange('');
                }
              }}
            >
              Limpiar
            </button>
            <button 
              type="button" // Especificar explícitamente que es un botón de tipo "button"
              className="keyboard-action backspace"
              onClick={(e) => {
                e.preventDefault(); // Prevenir el envío del formulario
                if (mathField) {
                  mathField.keystroke('Backspace');
                }
              }}
            >
              ⌫
            </button>
            <button 
              type="button" // Especificar explícitamente que es un botón de tipo "button"
              className="keyboard-action close"
              onClick={(e) => {
                e.preventDefault(); // Prevenir el envío del formulario
                setShowKeyboard(false);
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathKeyboard;