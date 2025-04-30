import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Table, Modal } from 'react-bootstrap';
import { metodosSimpson } from '../../services/api';
import MathKeyboard from '../MathKeyboard';
import FunctionGraph from '../FunctionGraph';
import '../../styles/Metodos.css';
import 'katex/dist/katex.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';

const Simpson = () => {
  // Estado para almacenar los datos del formulario
  const [formData, setFormData] = useState({
    equation: '',
    a: 0,
    b: 1,
    n: 10
  });
  
  // Estado para controlar la visibilidad de los componentes MathKeyboard
  const [mathKeyboardsKey, setMathKeyboardsKey] = useState(0);
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('input');
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedEquation = localStorage.getItem('simpson_equation');
    const savedA = localStorage.getItem('simpson_a');
    const savedB = localStorage.getItem('simpson_b');
    const savedN = localStorage.getItem('simpson_n');
    
    if (savedEquation) setFormData(prev => ({ ...prev, equation: savedEquation }));
    if (savedA) setFormData(prev => ({ ...prev, a: parseFloat(savedA) }));
    if (savedB) setFormData(prev => ({ ...prev, b: parseFloat(savedB) }));
    if (savedN) setFormData(prev => ({ ...prev, n: parseInt(savedN) }));
  }, []);
  
  // Efecto para forzar la recreación de los componentes MathKeyboard cuando se cambia a la pestaña de entrada
  useEffect(() => {
    if (activeTab === 'input') {
      // Incrementar la clave para forzar la recreación de los componentes
      setMathKeyboardsKey(prevKey => prevKey + 1);
    }
  }, [activeTab]);

  const handleEquationChange = (expr) => {
    // Guardar en el estado
    setFormData({ ...formData, equation: expr });
    
    // Guardar en localStorage
    localStorage.setItem('simpson_equation', expr);
    
    // Guardar también el formato original si está disponible
    if (window.lastLatexEquation) {
      localStorage.setItem('simpson_equation_latex', window.lastLatexEquation);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Convertir a número para campos numéricos
    if (['a', 'b', 'n'].includes(name)) {
      parsedValue = name === 'n' ? parseInt(value, 10) : parseFloat(value);
      
      // Asegurar que n sea par para el método de Simpson
      if (name === 'n' && parsedValue % 2 !== 0) {
        parsedValue = parsedValue + 1; // Hacer n par si es impar
      }
    }
    
    // Actualizar el estado
    setFormData({ ...formData, [name]: parsedValue });
    
    // Guardar en localStorage
    localStorage.setItem(`simpson_${name}`, parsedValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    setError(null);
    setShowErrorModal(false);
    
    // Asegurar que n sea par para el método de Simpson
    let dataToSend = { ...formData };
    if (dataToSend.n % 2 !== 0) {
      dataToSend.n = dataToSend.n + 1;
      setFormData(prev => ({ ...prev, n: dataToSend.n }));
      localStorage.setItem('simpson_n', dataToSend.n);
    }
    
    try {
      console.log("Enviando datos:", dataToSend);
      const response = await metodosSimpson.integrate(dataToSend);
      console.log("Respuesta recibida:", response);
      
      // Verificar si la respuesta contiene un error
      if (response.detail) {
        // Si hay un mensaje de error en la respuesta
        setError(response.detail);
        setShowErrorModal(true);
      } else {
        // Si la respuesta es exitosa
        setResult(response);
        setActiveTab('results'); // Cambiar a la pestaña de resultados
      }
    } catch (err) {
      console.error("Error completo:", err);
      
      // Manejar diferentes tipos de errores
      if (err.response && err.response.data) {
        // Error del servidor con datos estructurados
        if (err.response.data.detail) {
          setError(err.response.data.detail);
        } else {
          setError(JSON.stringify(err.response.data));
        }
      } else if (err.message) {
        // Error con mensaje (como errores de red)
        setError(err.message);
      } else {
        // Fallback para otros tipos de errores
        setError('Error al procesar la solicitud. Por favor, inténtelo de nuevo.');
      }
      
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para formatear números de manera segura
  const safeToFixed = (value, decimals = 10) => {
    if (value === undefined || value === null) return 'N/A';
    return typeof value === 'number' ? value.toFixed(decimals) : 'N/A';
  };

  // Función para cerrar el modal de error
  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
  };

  // Función para convertir expresiones evaluables de vuelta a formato LaTeX
  const convertToLatex = (expr) => {
    if (!expr) return '';
    
    // Intentar recuperar el LaTeX original del localStorage
    const equationLatex = localStorage.getItem('simpson_equation_latex');
    
    if (expr === formData.equation && equationLatex) {
      return equationLatex;
    }
    
    // Si no hay LaTeX original, hacer conversiones básicas
    let latex = expr;
    
    // Convertir potencias
    latex = latex.replace(/\*\*2/g, '^2');
    latex = latex.replace(/\*\*3/g, '^3');
    latex = latex.replace(/\*\*(\d+)/g, '^$1');
    
    // Convertir raíces
    latex = latex.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
    
    // Convertir fracciones
    latex = latex.replace(/\(([^)]+)\)\/\(([^)]+)\)/g, '\\frac{$1}{$2}');
    
    // Convertir multiplicaciones
    latex = latex.replace(/\*/g, '\\cdot ');
    
    return latex;
  };

  return (
    <div className="method-container">
      <h2 className="method-title">Método de Simpson</h2>
      
      <div className="method-tabs">
        <button 
          className={`tab-button ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          Entrada
        </button>
        <button 
          className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
          disabled={!result}
        >
          Resultados
        </button>
        <button 
          className={`tab-button ${activeTab === 'graph' ? 'active' : ''}`}
          onClick={() => setActiveTab('graph')}
        >
          Gráfico
        </button>
      </div>
      
      {/* Modal de Error */}
      <Modal 
        show={showErrorModal} 
        onHide={handleCloseErrorModal}
        centered
        className="error-modal"
      >
        <Modal.Header className="error-modal-header">
          <Modal.Title className="error-modal-title">
            <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon me-2" />
            Error en el cálculo
          </Modal.Title>
          <Button 
            variant="link" 
            className="error-close-btn" 
            onClick={handleCloseErrorModal}
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </Modal.Header>
        <Modal.Body className="error-modal-body">
          <p className="error-message">{error}</p>
        </Modal.Body>
        <Modal.Footer className="error-modal-footer">
          <p className="error-tip">
            Revise los datos ingresados y vuelva a intentarlo.
          </p>
          <Button variant="secondary" onClick={handleCloseErrorModal}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
      
      <div className="tab-content">
        {activeTab === 'input' && (
          <Card className="input-card">
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label>Función a integrar f(x)</Form.Label>
                  <div className="equation-info">
                    <p>Ingrese la función que desea integrar. Por ejemplo, x^2 + 1, sin(x), etc.</p>
                  </div>
                  {/* Usar key para forzar la recreación del componente */}
                  <MathKeyboard 
                    key={`equation-${mathKeyboardsKey}`}
                    onChange={handleEquationChange} 
                    initialValue={convertToLatex(formData.equation)} 
                  />
                </Form.Group>
                
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Límite inferior (a)</Form.Label>
                      <Form.Control
                        type="number"
                        step="any"
                        name="a"
                        value={formData.a}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </div>
                  
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Límite superior (b)</Form.Label>
                      <Form.Control
                        type="number"
                        step="any"
                        name="b"
                        value={formData.b}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </div>
                </div>
                
                <Form.Group className="mb-4">
                  <Form.Label>Número de subintervalos (n)</Form.Label>
                  <Form.Control
                    type="number"
                    name="n"
                    value={formData.n}
                    onChange={handleInputChange}
                    required
                    min="2"
                    max="1000"
                    step="2" // Permitir solo incrementos de 2
                  />
                  <Form.Text className="text-muted">
                    El número de subintervalos debe ser par para el método de Simpson.
                  </Form.Text>
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" /> 
                      Calculando...
                    </>
                  ) : (
                    'Calcular'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        )}
        
        {activeTab === 'results' && result && (
          <Card className="results-card">
            <Card.Body>
              <h3 className="results-title">Resultados</h3>
              
              <div className="result-summary">
                <div className="result-item">
                  <h4>Valor de la integral:</h4>
                  <p className="result-value">
                    {result.integral !== undefined && result.integral !== null 
                      ? safeToFixed(result.integral) 
                      : 'No calculado'}
                  </p>
                </div>
                
                <div className="result-item">
                  <h4>Subintervalos:</h4>
                  <p className="result-value">
                    {result.subintervals ? result.subintervals.length : 0}
                  </p>
                </div>
                
                <div className="result-item">
                  <h4>Estado:</h4>
                  <p className={`result-value ${result.success ? 'text-success' : 'text-danger'}`}>
                    {result.success ? 'Exitoso' : 'Fallido'}
                  </p>
                </div>
              </div>
              
              <div className="result-message">
                <h4>Mensaje:</h4>
                <p>{result.message || 'No hay mensaje disponible'}</p>
              </div>
              
              <h4 className="iterations-title">Tabla de Puntos</h4>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Punto x</th>
                      <th>Valor f(x)</th>
                      <th>Coeficiente</th>
                      <th>Valor ponderado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.subintervals && result.subintervals.map((subinterval, index) => (
                      <tr key={index}>
                        <td>{subinterval.index}</td>
                        <td>{safeToFixed(subinterval.x_value, 6)}</td>
                        <td>{safeToFixed(subinterval.y_value, 6)}</td>
                        <td>{subinterval.coefficient}</td>
                        <td>{safeToFixed(subinterval.weighted_value, 6)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              <div className="integration-formula">
                <h4>Fórmula utilizada:</h4>
                <p className="formula">
                  ∫<sub>{formData.a}</sub><sup>{formData.b}</sup> f(x) dx ≈ 
                  (h/3) × [f(x<sub>0</sub>) + 4f(x<sub>1</sub>) + 2f(x<sub>2</sub>) + 4f(x<sub>3</sub>) + ... + 4f(x<sub>n-1</sub>) + f(x<sub>n</sub>)]
                </p>
                <p className="formula-note">
                  Donde h = (b-a)/n y n es par.
                </p>
              </div>
            </Card.Body>
          </Card>
        )}
        
        {activeTab === 'graph' && (
          <Card className="graph-card">
            <Card.Body>
              <h3 className="graph-title">Gráfico de la Función y Aproximación</h3>
              <FunctionGraph 
                equation={formData.equation} 
                showTrapezoids={false} // No mostrar trapecios para Simpson
                showParabolas={true} // Añadir esta prop si tu componente FunctionGraph lo soporta
                a={formData.a} 
                b={formData.b} 
                n={formData.n} 
                result={result}
                method="simpson" // Añadir esta prop si tu componente FunctionGraph lo soporta
              />
              <div className="graph-legend">
                <div className="legend-item">
                  <span className="color-box red"></span>
                  <span>f(x) = {convertToLatex(formData.equation) || '...'}</span>
                </div>
                <div className="legend-item">
                  <span className="color-box green"></span>
                  <span>Aproximación de Simpson</span>
                </div>
              </div>
              
              <div className="integration-area">
                <h4>Interpretación gráfica:</h4>
                <p>
                  La integral representa el área bajo la curva f(x) desde x = {formData.a} hasta x = {formData.b}.
                </p>
                <p>
                  El método de Simpson aproxima esta área dividiendo el intervalo en {formData.n} subintervalos
                  y utilizando parábolas (polinomios de segundo grado) para aproximar la función en cada par de subintervalos.
                  Esto generalmente proporciona una mejor aproximación que el método del trapecio.
                </p>
                {result && (
                  <p className="result-highlight">
                    Área total aproximada: {safeToFixed(result.integral, 6)}
                  </p>
                )}
              </div>
            </Card.Body>
          </Card>
        )}
        
      </div>
    </div>
  );
};

export default Simpson;