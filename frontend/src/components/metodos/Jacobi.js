import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Table, Modal } from 'react-bootstrap';
import { metodosJacobi } from '../../services/api';
import '../../styles/Metodos.css';
import 'katex/dist/katex.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';

const Jacobi = () => {
  const [formData, setFormData] = useState({
    A: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ],
    b: [0, 0, 0],
    initial_guess: [0, 0, 0],
    tolerance: 1e-6,
    max_iterations: 100
  });
  
  const [matrixSize, setMatrixSize] = useState(3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('input');
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedMatrixSize = localStorage.getItem('jacobi_matrixSize');
    const savedA = localStorage.getItem('jacobi_A');
    const savedB = localStorage.getItem('jacobi_b');
    const savedInitialGuess = localStorage.getItem('jacobi_initial_guess');
    const savedTolerance = localStorage.getItem('jacobi_tolerance');
    const savedMaxIterations = localStorage.getItem('jacobi_max_iterations');
    
    if (savedMatrixSize) {
      const size = parseInt(savedMatrixSize);
      setMatrixSize(size);
    }
    
    if (savedA) {
      try {
        const A = JSON.parse(savedA);
        setFormData(prev => ({ ...prev, A }));
      } catch (e) {
        console.error("Error parsing saved matrix A:", e);
      }
    }
    
    if (savedB) {
      try {
        const b = JSON.parse(savedB);
        setFormData(prev => ({ ...prev, b }));
      } catch (e) {
        console.error("Error parsing saved vector b:", e);
      }
    }
    
    if (savedInitialGuess) {
      try {
        const initial_guess = JSON.parse(savedInitialGuess);
        setFormData(prev => ({ ...prev, initial_guess }));
      } catch (e) {
        console.error("Error parsing saved initial guess:", e);
      }
    }
    
    if (savedTolerance) setFormData(prev => ({ ...prev, tolerance: parseFloat(savedTolerance) }));
    if (savedMaxIterations) setFormData(prev => ({ ...prev, max_iterations: parseInt(savedMaxIterations) }));
  }, []);

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

  // Manejar cambio en el tamaño de la matriz
  const handleMatrixSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setMatrixSize(newSize);
    
    // Crear nueva matriz A y vectores b e initial_guess con el nuevo tamaño
    const newA = Array(newSize).fill().map(() => Array(newSize).fill(0));
    const newB = Array(newSize).fill(0);
    const newInitialGuess = Array(newSize).fill(0);
    
    // Preservar valores existentes si es posible
    for (let i = 0; i < Math.min(newSize, formData.A.length); i++) {
      for (let j = 0; j < Math.min(newSize, formData.A[i].length); j++) {
        newA[i][j] = formData.A[i][j];
      }
      if (i < formData.b.length) newB[i] = formData.b[i];
      if (i < formData.initial_guess.length) newInitialGuess[i] = formData.initial_guess[i];
    }
    
    const updatedFormData = {
      ...formData,
      A: newA,
      b: newB,
      initial_guess: newInitialGuess
    };
    
    setFormData(updatedFormData);
    
    // Guardar en localStorage
    localStorage.setItem('jacobi_matrixSize', newSize);
    localStorage.setItem('jacobi_A', JSON.stringify(newA));
    localStorage.setItem('jacobi_b', JSON.stringify(newB));
    localStorage.setItem('jacobi_initial_guess', JSON.stringify(newInitialGuess));
  };

  // Manejar cambios en la matriz A
  const handleMatrixAChange = (rowIndex, colIndex, value) => {
    const newA = [...formData.A];
    newA[rowIndex][colIndex] = parseFloat(value) || 0;
    
    const updatedFormData = { ...formData, A: newA };
    setFormData(updatedFormData);
    
    // Guardar en localStorage
    localStorage.setItem('jacobi_A', JSON.stringify(newA));
  };

  // Manejar cambios en el vector b
  const handleVectorBChange = (index, value) => {
    const newB = [...formData.b];
    newB[index] = parseFloat(value) || 0;
    
    const updatedFormData = { ...formData, b: newB };
    setFormData(updatedFormData);
    
    // Guardar en localStorage
    localStorage.setItem('jacobi_b', JSON.stringify(newB));
  };

  // Manejar cambios en el vector de aproximación inicial
  const handleInitialGuessChange = (index, value) => {
    const newInitialGuess = [...formData.initial_guess];
    newInitialGuess[index] = parseFloat(value) || 0;
    
    const updatedFormData = { ...formData, initial_guess: newInitialGuess };
    setFormData(updatedFormData);
    
    // Guardar en localStorage
    localStorage.setItem('jacobi_initial_guess', JSON.stringify(newInitialGuess));
  };

  // Manejar cambios en otros campos del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Convertir a número para campos numéricos
    if (['tolerance', 'max_iterations'].includes(name)) {
      parsedValue = name === 'max_iterations' ? parseInt(value, 10) : parseFloat(value);
    }
    
    // Actualizar el estado
    const updatedFormData = { ...formData, [name]: parsedValue };
    setFormData(updatedFormData);
    
    // Guardar en localStorage
    localStorage.setItem(`jacobi_${name}`, value);
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    setError(null);
    setShowErrorModal(false);
    setResult(null); // Limpiar resultados previos
    
    try {
      console.log("Enviando datos:", formData);
      const response = await metodosJacobi.solve(formData);
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

  // Función para cargar ejemplos predefinidos
  const loadExample = (exampleNumber) => {
    if (exampleNumber === 1) {
      // Ejemplo 1: Sistema diagonalmente dominante 3x3
      setMatrixSize(3);
      const updatedFormData = {
        A: [
          [10, 2, 1],
          [2, 10, 1],
          [1, 1, 5]
        ],
        b: [13, 13, 7],
        initial_guess: [0, 0, 0],
        tolerance: 1e-6,
        max_iterations: 100
      };
      
      setFormData(updatedFormData);
      
      // Guardar en localStorage
      localStorage.setItem('jacobi_matrixSize', 3);
      localStorage.setItem('jacobi_A', JSON.stringify(updatedFormData.A));
      localStorage.setItem('jacobi_b', JSON.stringify(updatedFormData.b));
      localStorage.setItem('jacobi_initial_guess', JSON.stringify(updatedFormData.initial_guess));
      localStorage.setItem('jacobi_tolerance', updatedFormData.tolerance);
      localStorage.setItem('jacobi_max_iterations', updatedFormData.max_iterations);
    } else if (exampleNumber === 2) {
      // Ejemplo 2: Sistema 4x4
      setMatrixSize(4);
      const updatedFormData = {
        A: [
          [10, -1, 0, 0],
          [-1, 11, -1, 0],
          [0, -1, 12, -1],
          [0, 0, -1, 13]
        ],
        b: [9, 9, 10, 12],
        initial_guess: [0, 0, 0, 0],
        tolerance: 1e-6,
        max_iterations: 100
      };
      
      setFormData(updatedFormData);
      
      // Guardar en localStorage
      localStorage.setItem('jacobi_matrixSize', 4);
      localStorage.setItem('jacobi_A', JSON.stringify(updatedFormData.A));
      localStorage.setItem('jacobi_b', JSON.stringify(updatedFormData.b));
      localStorage.setItem('jacobi_initial_guess', JSON.stringify(updatedFormData.initial_guess));
      localStorage.setItem('jacobi_tolerance', updatedFormData.tolerance);
      localStorage.setItem('jacobi_max_iterations', updatedFormData.max_iterations);
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

  return (
    <div className="method-container">
      <h2 className="method-title">Método de Jacobi</h2>
      
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
                <div className="examples-section mb-4">
                  <h5>Ejemplos predefinidos:</h5>
                  <div className="example-buttons">
                    <Button 
                      variant="outline-primary" 
                      onClick={() => loadExample(1)}
                      className="me-2"
                    >
                      Ejemplo 1 (3x3)
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      onClick={() => loadExample(2)}
                    >
                      Ejemplo 2 (4x4)
                    </Button>
                  </div>
                </div>
                
                <Form.Group className="mb-3">
                  <Form.Label>Tamaño de la matriz</Form.Label>
                  <Form.Select
                    value={matrixSize}
                    onChange={handleMatrixSizeChange}
                  >
                    <option value="2">2x2</option>
                    <option value="3">3x3</option>
                    <option value="4">4x4</option>
                    <option value="5">5x5</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Matriz de coeficientes (A)</Form.Label>
                  <div className="matrix-input">
                    {Array(matrixSize).fill().map((_, rowIndex) => (
                      <div key={`row-${rowIndex}`} className="matrix-row">
                        {Array(matrixSize).fill().map((_, colIndex) => (
                          <Form.Control
                            key={`cell-${rowIndex}-${colIndex}`}
                            type="number"
                            step="any"
                            value={formData.A[rowIndex][colIndex]}
                            onChange={(e) => handleMatrixAChange(rowIndex, colIndex, e.target.value)}
                            className="matrix-cell"
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Vector de términos independientes (b)</Form.Label>
                  <div className="vector-input">
                    {Array(matrixSize).fill().map((_, index) => (
                      <Form.Control
                        key={`b-${index}`}
                        type="number"
                        step="any"
                        value={formData.b[index]}
                        onChange={(e) => handleVectorBChange(index, e.target.value)}
                        className="vector-cell"
                      />
                    ))}
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Vector de aproximación inicial (opcional)</Form.Label>
                  <div className="vector-input">
                    {Array(matrixSize).fill().map((_, index) => (
                      <Form.Control
                        key={`initial-${index}`}
                        type="number"
                        step="any"
                        value={formData.initial_guess[index]}
                        onChange={(e) => handleInitialGuessChange(index, e.target.value)}
                        className="vector-cell"
                      />
                    ))}
                  </div>
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
                  <h4>Convergencia:</h4>
                  <p className={`result-value ${result.converged ? 'text-success' : 'text-danger'}`}>
                    {result.converged ? 'Sí' : 'No'}
                  </p>
                </div>
                
                <div className="result-item">
                  <h4>Iteraciones:</h4>
                  <p className="result-value">
                    {result.iterations}
                  </p>
                </div>
                
                <div className="result-item">
                  <h4>Error final:</h4>
                  <p className="result-value">
                    {safeToFixed(result.error)}
                  </p>
                </div>
              </div>
              
              <h4 className="solution-title">Solución del sistema</h4>
              <div className="solution-vector">
                {result.solution && result.solution.map((value, index) => (
                  <div key={`sol-${index}`} className="solution-item">
                    <span className="solution-variable">x<sub>{index+1}</sub> = </span>
                    <span className="solution-value">{safeToFixed(value, 8)}</span>
                  </div>
                ))}
              </div>
              
              {result.warnings && result.warnings.length > 0 && (
                <div className="warnings-section mt-4">
                  <h4>Advertencias:</h4>
                  <ul className="warnings-list">
                    {result.warnings.map((warning, index) => (
                      <li key={index} className="warning-item">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.convergence_details && (
                <div className="convergence-details mt-4">
                  <h4>Detalles de convergencia:</h4>
                  <ul>
                    {Object.entries(result.convergence_details).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key.replace(/_/g, ' ')}:</strong> {
                          typeof value === 'number' ? safeToFixed(value, 4) : 
                          Array.isArray(value) ? `[${value.map(v => safeToFixed(v, 4)).join(', ')}]` : 
                          String(value)
                        }
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card.Body>
          </Card>
        )}
        
      </div>
    </div>
  );
};

export default Jacobi;