import React, { useState } from 'react';
import { addStyles, EditableMathField } from 'react-mathquill';
import '../styles/MathKeyboard.css'; // Asegúrate que la ruta es correcta

addStyles();

const MathKeyboard = ({ onChange, initialValue = '' }) => {
  const [mathField, setMathField] = useState(null);
  const [latexValue, setLatexValue] = useState(initialValue);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const handleMathFieldChange = (currentMathField) => {
    const latex = currentMathField.latex();
    setLatexValue(latex);
    const evaluableExpression = convertLatexToEvaluable(latex);
    onChange(evaluableExpression);
  };

  const convertLatexToEvaluable = (latex) => {
    if (!latex) return '';

    let expr = latex;
    let prevExpr = '';
    let iterations = 0;
    const MAX_ITERATIONS = 20;

    while (expr !== prevExpr && iterations < MAX_ITERATIONS) {
      prevExpr = expr;
      iterations++;

      expr = expr.replace(/e\^{([^}]*)}/g, 'exp($1)');
      expr = expr.replace(/e\^([a-zA-Z0-9])/g, 'exp($1)');
      expr = expr.replace(/\\cdot/g, '*');
      expr = expr.replace(/\\times/g, '*');
      expr = expr.replace(/\\div/g, '/');
      expr = expr.replace(/\\frac{([^}]*)}{([^}]*)}/g, '($1)/($2)');
      expr = expr.replace(/\\sqrt\[(\d+)\]{([^}]*)}/g, '($2)**(1/$1)');
      expr = expr.replace(/\\sqrt{([^}]*)}/g, 'sqrt($1)');
      expr = expr.replace(/\^{([^}]*)}/g, '**($1)');
      expr = expr.replace(/\^([a-zA-Z0-9]+)/g, '**$1');
      expr = expr.replace(/\\sin\^{-1}/g, 'asin');
      expr = expr.replace(/\\cos\^{-1}/g, 'acos');
      expr = expr.replace(/\\tan\^{-1}/g, 'atan');
      expr = expr.replace(/\\sinh/g, 'sinh');
      expr = expr.replace(/\\cosh/g, 'cosh');
      expr = expr.replace(/\\tanh/g, 'tanh');
      expr = expr.replace(/\\sin/g, 'sin');
      expr = expr.replace(/\\cos/g, 'cos');
      expr = expr.replace(/\\tan/g, 'tan');
      expr = expr.replace(/\\cot/g, '(1/tan)');
      expr = expr.replace(/\\sec/g, '(1/cos)');
      expr = expr.replace(/\\csc/g, '(1/sin)');
      expr = expr.replace(/\\log_\{([0-9.]+)\}\(([^)]*)\)/g, 'log($2, $1)');
      expr = expr.replace(/\\log_\{10\}\(([^)]*)\)/g, 'log10($1)');
      expr = expr.replace(/\\ln\(([^}]*)\)/g, 'log($1)');
      expr = expr.replace(/\\log\(([^}]*)\)/g, 'log10($1)');
      expr = expr.replace(/(?<![a-zA-Z])\\pi(?![a-zA-Z])/g, 'pi');
      expr = expr.replace(/\\infty/g, 'float("inf")');
      expr = expr.replace(/\b(e)\b(?!\s*?\()/g, 'math.e');
      expr = expr.replace(/\\left\(/g, '(');
      expr = expr.replace(/\\right\)/g, ')');
      expr = expr.replace(/\\left\[/g, '[');
      expr = expr.replace(/\\right\]/g, ']');
      expr = expr.replace(/\\left\\\{/g, '(');
      expr = expr.replace(/\\right\\\}/g, ')');
       // Manejar valores absolutos |x| -> abs(x)
      expr = expr.replace(/\\left\|([^|]*)\\right\|/g, 'abs($1)');
      expr = expr.replace(/\|([^|]*)\|/g, 'abs($1)'); // Para |x| sin \left y \right
    }

    if (iterations >= MAX_ITERATIONS) {
      console.warn("ConvertLatexToEvaluable: Se alcanzó el máximo de iteraciones.");
    }

    expr = expr.replace(/\s+/g, '');
    expr = expr.replace(/\{([^{}]*)\}/g, '$1');
    expr = expr.replace(/(\d)([a-zA-Z(])/g, '$1*$2');
    expr = expr.replace(/([a-zA-Z0-9)])\(/g, '$1*(');
    expr = expr.replace(/(\))([a-zA-Z0-9_])/g, '$1*$2');

    const mathFunctions = [
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
      'sqrt', 'log', 'log10', 'exp', 'pow', 'abs', 'gamma'
    ];
    mathFunctions.forEach(func => {
      const pattern = new RegExp(`${func}\\*\\(`, 'g');
      expr = expr.replace(pattern, `${func}(`);
    });

    if (expr.includes('\\')) {
      console.warn('Advertencia: Expresión aún podría contener LaTeX:', expr);
    }
    
    // Asegurarse de que las funciones que esperan paréntesis los tengan, si no fueron agregados por el teclado
    // Por ejemplo, si el usuario escribió 'sin x' en lugar de 'sin(x)'
    // Esto es más avanzado y depende de cómo MathQuill formatea. Usualmente MathQuill ayuda con esto.
    // Ejemplo simple:
    // mathFunctions.forEach(func => {
    //   // Busca 'func' seguido de algo que no sea '(' y que sea una variable o número
    //   const pattern = new RegExp(`\\b${func}(?!\\s*\\()\\s*([a-zA-Z0-9_.]+|\\([^)]*\\))`, 'g');
    //   expr = expr.replace(pattern, `${func}($1)`);
    // });


    console.log('LaTeX original:', latex);
    console.log('Expresión convertida para Python:', expr);
    return expr;
  };

  const insertSymbol = (symbol, e) => {
    if (e) e.preventDefault();
    if (mathField) {
      // Si el símbolo ya incluye paréntesis (como en \log\left(\right)), MathQuill lo maneja bien.
      // Si el símbolo es solo una función como '\sin', y queremos que siempre tenga paréntesis,
      // podríamos añadir '\left(\right)' aquí, pero es mejor si el 'value' del key ya lo tiene.
      mathField.write(symbol);
      mathField.focus();
    }
  };

  const toggleKeyboard = (e) => {
    if (e) e.preventDefault();
    setShowKeyboard(!showKeyboard);
  };

  // TU DEFINICIÓN ORIGINAL DE keyboardCategories
  const keyboardCategories = [
    {
      name: "Básico",
      keys: [
        { label: "7", value: "7" }, { label: "8", value: "8" }, { label: "9", value: "9" }, { label: "÷", value: "\\div" },
        { label: "(", value: "(" }, { label: ")", value: ")" }, { label: "4", value: "4" }, { label: "5", value: "5" },
        { label: "6", value: "6" }, { label: "×", value: "\\cdot" }, { label: "[", value: "[" }, { label: "]", value: "]" },
        { label: "1", value: "1" }, { label: "2", value: "2" }, { label: "3", value: "3" }, { label: "-", value: "-" },
        { label: "{", value: "\\{" }, { label: "}", value: "\\}" }, { label: "0", value: "0" }, { label: ".", value: "." },
        { label: "π", value: "\\pi" }, { label: "+", value: "+" }, { label: "=", value: "=" }, { label: "≠", value: "\\neq" }
      ]
    },
    {
      name: "Funciones",
      keys: [
        { label: "x²", value: "x^{2}" }, { label: "x³", value: "x^{3}" }, { label: "xⁿ", value: "x^{}" }, // Permite al usuario llenar 'n'
        { label: "eˣ", value: "e^{x}" }, { label: "10ˣ", value: "10^{x}" }, { label: "√", value: "\\sqrt{}" },
        { label: "∛", value: "\\sqrt[3]{}" }, { label: "ⁿ√", value: "\\sqrt[]{}", n:true },
        // Para funciones, es bueno incluir los paréntesis para que MathQuill posicione el cursor dentro.
        { label: "log", value: "\\log\\left(\\right)" }, { label: "ln", value: "\\ln\\left(\\right)" },
        { label: "log₁₀", value: "\\log_{10}\\left(\\right)" }, { label: "|x|", value: "\\left|\\right|" } // Usuario escribe x dentro
      ]
    },
    {
      name: "Trigonometría",
      keys: [
        { label: "sin", value: "\\sin\\left(\\right)" }, { label: "cos", value: "\\cos\\left(\\right)" }, { label: "tan", value: "\\tan\\left(\\right)" },
        { label: "csc", value: "\\csc\\left(\\right)" }, { label: "sec", value: "\\sec\\left(\\right)" }, { label: "cot", value: "\\cot\\left(\\right)" },
        { label: "sin⁻¹", value: "\\sin^{-1}\\left(\\right)" }, { label: "cos⁻¹", value: "\\cos^{-1}\\left(\\right)" }, { label: "tan⁻¹", value: "\\tan^{-1}\\left(\\right)" },
        { label: "sinh", value: "\\sinh\\left(\\right)" }, { label: "cosh", value: "\\cosh\\left(\\right)" }, { label: "tanh", value: "\\tanh\\left(\\right)" }
      ]
    },
    {
      name: "Fracciones", // Esta categoría parece más de "Cálculo y Estructuras"
      keys: [
        { label: "a/b", value: "\\frac{}{}" },
        { label: "∂/∂x", value: "\\frac{\\partial}{\\partial x}" }, // Estos son para derivadas, no sé si tu backend los procesará.
        { label: "dx/dy", value: "\\frac{dx}{dy}" },
        { label: "d/dx", value: "\\frac{d}{dx}" },
        { label: "d²/dx²", value: "\\frac{d^2}{dx^2}" },
        { label: "∫", value: "\\int" },
        { label: "∫_a^b", value: "\\int_{}^{}" }, // Usuario llena límites y función
        { label: "∑", value: "\\sum_{i=1}^{n}" },
        { label: "∏", value: "\\prod_{i=1}^{n}" },
        { label: "lim", value: "\\lim_{x \\to }" }
      ]
    },
    {
      name: "Símbolos",
      keys: [
        { label: "x", value: "x" }, { label: "y", value: "y" }, { label: "z", value: "z" },
        { label: "θ", value: "\\theta" }, { label: "α", value: "\\alpha" }, { label: "β", value: "\\beta" },
        { label: "γ", value: "\\gamma" }, { label: "δ", value: "\\delta" }, { label: "ε", value: "\\epsilon" },
        { label: "λ", value: "\\lambda" }, { label: "μ", value: "\\mu" }, { label: "σ", value: "\\sigma" },
        { label: "∞", value: "\\infty" }
      ]
    },
    {
      name: "Operadores",
      keys: [
        { label: "≤", value: "\\leq" }, { label: "≥", value: "\\geq" }, { label: "<", value: "<" },
        { label: ">", value: ">" }, { label: "±", value: "\\pm" }, { label: "∓", value: "\\mp" },
        { label: "≈", value: "\\approx" }, { label: "∝", value: "\\propto" }, { label: "≡", value: "\\equiv" },
        { label: "→", value: "\\rightarrow" }, { label: "←", value: "\\leftarrow" }, { label: "↔", value: "\\leftrightarrow" }
      ]
    }
  ];

  const [activeCategory, setActiveCategory] = useState(keyboardCategories[0].name);

  return (
    <div className="math-keyboard-container">
      <div className="math-input-field">
        <EditableMathField
          latex={latexValue}
          onChange={handleMathFieldChange}
          mathquillDidMount={(mf) => setMathField(mf)}
        />
        <button
          type="button"
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
                type="button"
                className={`category-button ${activeCategory === category.name ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
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
                type="button"
                className="keyboard-key"
                onClick={(e) => insertSymbol(key.value, e)}
              >
                {key.label}
              </button>
            ))}
          </div>

          <div className="keyboard-actions">
            <button
              type="button"
              className="keyboard-action clear"
              onClick={(e) => {
                e.preventDefault();
                if (mathField) {
                  mathField.latex('');
                }
              }}
            >
              Limpiar
            </button>
            <button
              type="button"
              className="keyboard-action backspace"
              onClick={(e) => {
                e.preventDefault();
                if (mathField) {
                  mathField.keystroke('Backspace');
                }
              }}
            >
              ⌫
            </button>
            <button
              type="button"
              className="keyboard-action close"
              onClick={(e) => {
                e.preventDefault();
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