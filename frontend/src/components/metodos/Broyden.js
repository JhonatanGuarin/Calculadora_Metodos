import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Table, Modal } from 'react-bootstrap';
import { metodosBroyden } from '../../services/api';
import MathKeyboard from '../MathKeyboard';
import FunctionGraph from '../FunctionGraph';
import '../../styles/Metodos.css';
import 'katex/dist/katex.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';

const Broyden = () => {
  // Estado para almacenar los datos del formulario
  const [formData, setFormData] = useState({
    equation: '',
    x0: 0,
    tolerance: 1e-6,
    max_iterations: 100
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
    const savedEquation = localStorage.getItem('broyden_equation');
    const savedX0 = localStorage.getItem('broyden_x0');
    const savedTolerance = localStorage.getItem('broyden_tolerance');
    const savedMaxIterations = localStorage.getItem('broyden_max_iterations');
    
    if (savedEquation) setFormData(prev => ({ ...prev, equation: savedEquation }));
    if (savedX0) setFormData(prev => ({ ...prev, x0: parseFloat(savedX0) }));
    if (savedTolerance) setFormData(prev => ({ ...prev, tolerance: parseFloat(savedTolerance) }));
    if (savedMaxIterations) setFormData(prev => ({ ...prev, max_iterations: parseInt(savedMaxIterations) }));
  }, []);
  
  // Efecto para forzar la recreación de los componentes MathKeyboard cuando se cambia a la pestaña de entrada
  useEffect(() => {
    if (activeTab === 'input') {
      // Incrementar la clave para forzar la recreación de los componentes
      setMathKeyboardsKey(prevKey => prevKey + 1);
    }
  }, [activeTab]);

  const toleranceOptions = [
    { value: 1e-1, label: '10⁻¹' },
    { value: 1e-2, label: '10⁻²' },
    { value: 1e-3, label: '10⁻³' },
    { value: 1e-4, label: '10⁻⁴' },
    { value: 1e-5, label: '10⁻⁵' },
    { value: 1e-6, label: '10⁻⁶' },
    { value: 1e-7, label: '10⁻⁷' },
    { value: 1e-8, label: '10⁻⁸' },
    { value: 1e-9, label: '10⁻⁹' },
    { value: 1e-10, label: '10⁻¹⁰' }
  ];

  const handleEquationChange = (expr) => {
    // Guardar en el estado
    setFormData({ ...formData, equation: expr });
    
    // Guardar en localStorage
    localStorage.setItem('broyden_equation', expr);
    
    // Guardar también el formato original si está disponible
    if (window.lastLatexEquation) {
      localStorage.setItem('broyden_equation_latex', window.lastLatexEquation);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Convertir a número para campos numéricos
    if (['x0', 'tolerance', 'max_iterations'].includes(name)) {
      parsedValue = name === 'max_iterations' ? parseInt(value, 10) : parseFloat(value);
    }
    
    // Actualizar el estado
    setFormData({ ...formData, [name]: parsedValue });
    
    // Guardar en localStorage
    localStorage.setItem(`broyden_${name}`, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    setError(null);
    setShowErrorModal(false);
    setResult(null); // Limpiar resultados previos
    
    try {
      console.log("Enviando datos:", formData);
      const response = await metodosBroyden.solve(formData);
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

  // Función auxiliar para formatear en notación científica
  const safeToExponential = (value, decimals = 6) => {
    if (value === undefined || value === null) return 'N/A';
    return typeof value === 'number' ? value.toExponential(decimals) : 'N/A';
  };

  // Función para cerrar el modal de error
  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
  };

  // Función para convertir expresiones evaluables de vuelta a formato LaTeX
  const convertToLatex = (expr) => {
    if (!expr) return '';
    
    // Intentar recuperar el LaTeX original del localStorage
    const equationLatex = localStorage.getItem('broyden_equation_latex');
    
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
      <h2 className="method-title">Método de Broyden</h2>
      
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
                  <Form.Label>Ecuación f(x) = 0</Form.Label>
                  <div className="equation-info">
                    <p>Ingrese la ecuación en la forma f(x) = 0. Por ejemplo, para resolver x² - 4 = 0, ingrese x^2 - 4.</p>
                  </div>
                  {/* Usar key para forzar la recreación del componente */}
                  <MathKeyboard 
                    key={`equation-${mathKeyboardsKey}`}
                    onChange={handleEquationChange} 
                    initialValue={convertToLatex(formData.equation)} 
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Valor inicial (x₀)</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    name="x0"
                    value={formData.x0}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Tolerancia</Form.Label>
                  <Form.Select
                    name="tolerance"
                    value={formData.tolerance}
                    onChange={handleInputChange}
                    required
                  >
                    {toleranceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Máximo de iteraciones</Form.Label>
                  <Form.Control
                    type="number"
                    name="max_iterations"
                    value={formData.max_iterations}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="1000"
                  />
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
                  <h4>Raíz encontrada:</h4>
                  <p className="result-value">
                    {result.root !== undefined && result.root !== null 
                      ? safeToFixed(result.root) 
                      : 'No encontrada'}
                  </p>
                </div>
                
                <div className="result-item">
                  <h4>Iteraciones:</h4>
                  <p className="result-value">
                    {result.iterations}
                  </p>
                </div>
                
                <div className="result-item">
                  <h4>Convergencia:</h4>
                  <p className={`result-value ${result.convergence ? 'text-success' : 'text-danger'}`}>
                    {result.convergence ? 'Sí' : 'No'}
                  </p>
                </div>
                
                <div className="result-item">
                  <h4>Error:</h4>
                  <p className="result-value">
                    {result.error !== undefined && result.error !== null 
                      ? safeToExponential(result.error) 
                      : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="result-message">
                <h4>Mensaje:</h4>
                <p>{result.message || 'No hay mensaje disponible'}</p>
              </div>
              
              <h4 className="iterations-title">Tabla de Iteraciones</h4>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Iteración</th>
                      <th>x<sub>i</sub></th>
                      <th>f(x<sub>i</sub>)</th>
                      <th>B<sub>i</sub></th>
                      <th>s<sub>i</sub></th>
                      <th>y<sub>i</sub></th>
                      <th>x<sub>i+1</sub></th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.all_iterations && result.all_iterations.map((iter, index) => (
                      <tr key={index}>
                        <td>{iter.iteration}</td>
                        <td>{safeToFixed(iter.x)}</td>
                        <td>{safeToFixed(iter["f(x)"])}</td>
                        <td>{safeToFixed(iter.B)}</td>
                        <td>{safeToFixed(iter.s)}</td>
                        <td>{safeToFixed(iter.y)}</td>
                        <td>{safeToFixed(iter.next_x)}</td>
                        <td>{safeToFixed(iter.error)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )}
        
        {activeTab === 'graph' && (
          <Card className="graph-card">
            <Card.Body>
              <h3 className="graph-title">Gráfico de la Función</h3>
              <FunctionGraph equation={formData.equation} />
              <div className="graph-legend">
                <div className="legend-item">
                  <span className="color-box red"></span>
                  <span>f(x) = {convertToLatex(formData.equation) || '...'}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}
        
      </div>
    </div>
  );
};

export default Broyden;