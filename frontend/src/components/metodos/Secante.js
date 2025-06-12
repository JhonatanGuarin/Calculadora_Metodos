import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Table, Modal, Dropdown, DropdownButton, ButtonGroup } from 'react-bootstrap';
import { metodosSecante } from '../../services/api';
import MathKeyboard from '../MathKeyboard';
import FunctionGraph from '../FunctionGraph';
import '../../styles/Metodos.css';
import 'katex/dist/katex.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes, faDownload, faTable, faFileExcel, faFileCsv } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Secante = () => {
  // Estado para almacenar los datos del formulario
  const [formData, setFormData] = useState({
    equation: '',
    x0: 0,
    x1: 1,
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
  
  // Estado para el modal de exportación
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [selectedColumns, setSelectedColumns] = useState({
    iteration: true,
    x_prev: true,
    x_curr: true,
    x_next: true,
    f_prev: true,
    f_curr: true,
    error: true
  });
  
  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedEquation = localStorage.getItem('secante_equation');
    const savedX0 = localStorage.getItem('secante_x0');
    const savedX1 = localStorage.getItem('secante_x1');
    const savedTolerance = localStorage.getItem('secante_tolerance');
    const savedMaxIterations = localStorage.getItem('secante_max_iterations');
    
    if (savedEquation) setFormData(prev => ({ ...prev, equation: savedEquation }));
    if (savedX0) setFormData(prev => ({ ...prev, x0: parseFloat(savedX0) }));
    if (savedX1) setFormData(prev => ({ ...prev, x1: parseFloat(savedX1) }));
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

  // Definición de columnas disponibles para exportar
  const availableColumns = [
    { id: 'iteration', label: 'Iteración', key: 'iteration' },
    { id: 'x_prev', label: 'x_prev', key: 'x_prev' },
    { id: 'x_curr', label: 'x_curr', key: 'x_curr' },
    { id: 'x_next', label: 'x_next', key: 'x_next' },
    { id: 'f_prev', label: 'f(x_prev)', key: 'f_prev' },
    { id: 'f_curr', label: 'f(x_curr)', key: 'f_curr' },
    { id: 'error', label: 'Error', key: 'error' }
  ];

  const handleEquationChange = (expr) => {
    // Guardar en el estado
    setFormData({ ...formData, equation: expr });
    
    // Guardar en localStorage
    localStorage.setItem('secante_equation', expr);
    
    // Guardar también el formato original si está disponible
    if (window.lastLatexEquation) {
      localStorage.setItem('secante_equation_latex', window.lastLatexEquation);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Convertir a número para campos numéricos
    if (['x0', 'x1', 'tolerance', 'max_iterations'].includes(name)) {
      parsedValue = name === 'max_iterations' ? parseInt(value, 10) : parseFloat(value);
    }
    
    // Actualizar el estado
    setFormData({ ...formData, [name]: parsedValue });
    
    // Guardar en localStorage
    localStorage.setItem(`secante_${name}`, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    setError(null);
    setShowErrorModal(false);
    setResult(null); // Limpiar resultados previos
    
    try {
      console.log("Enviando datos:", formData);
      const response = await metodosSecante.solve(formData);
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

  // Función para abrir el modal de exportación
  const handleOpenExportModal = () => {
    setShowExportModal(true);
  };

  // Función para cerrar el modal de exportación
  const handleCloseExportModal = () => {
    setShowExportModal(false);
  };

  // Función para cambiar el formato de exportación
  const handleExportFormatChange = (format) => {
    setExportFormat(format);
  };

  // Función para cambiar las columnas seleccionadas
  const handleColumnToggle = (columnId) => {
    setSelectedColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  // Función para seleccionar todas las columnas
  const handleSelectAllColumns = () => {
    const allSelected = {};
    availableColumns.forEach(col => {
      allSelected[col.id] = true;
    });
    setSelectedColumns(allSelected);
  };

  // Función para deseleccionar todas las columnas
  const handleDeselectAllColumns = () => {
    const noneSelected = {};
    availableColumns.forEach(col => {
      noneSelected[col.id] = false;
    });
    setSelectedColumns(noneSelected);
  };

  // Función para exportar los datos
  const handleExport = () => {
    if (!result || !result.all_iterations || result.all_iterations.length === 0) {
      setError("No hay datos para exportar");
      setShowErrorModal(true);
      setShowExportModal(false);
      return;
    }
    
    try {
      // Filtrar las columnas seleccionadas
      const selectedColumnsList = availableColumns.filter(col => selectedColumns[col.id]);
      
      if (selectedColumnsList.length === 0) {
        setError("Debe seleccionar al menos una columna para exportar");
        setShowErrorModal(true);
        return;
      }
      
      // Crear los encabezados
      const headers = selectedColumnsList.map(col => col.label);
      
      // Crear los datos de las filas
      const rows = result.all_iterations.map(iter => {
        return selectedColumnsList.map(col => {
          const value = iter[col.key];
          return value !== null && value !== undefined ? Number(value) : 'N/A';
        });
      });
      
      // Información adicional sobre la raíz encontrada
      const infoRows = [
        ['Método de la Secante - Resultados'],
        ['Ecuación f(x) = 0:', formData.equation],
        ['Raíz encontrada:', result.root !== null ? Number(result.root) : 'No encontrada'],
        ['Iteraciones totales:', result.iterations],
        ['Tolerancia utilizada:', formData.tolerance],
        ['Primera aproximación x₀:', formData.x0],
        ['Segunda aproximación x₁:', formData.x1],
        ['Convergencia:', result.converged ? 'Sí' : 'No'],
        ['Mensaje:', result.message]
      ];
      
      // Timestamp para el nombre del archivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      
      if (exportFormat === 'excel') {
        // Crear una hoja de cálculo con la información general
        const infoWorksheet = XLSX.utils.aoa_to_sheet(infoRows);
        
        // Crear una hoja de cálculo con los datos de las iteraciones
        const worksheetData = [headers, ...rows];
        const iterationsWorksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // Crear un libro de trabajo y añadir las hojas
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, infoWorksheet, 'Información');
        XLSX.utils.book_append_sheet(workbook, iterationsWorksheet, 'Iteraciones');
        
        // Generar el archivo Excel
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Descargar el archivo
        saveAs(data, `secante_${timestamp}.xlsx`);
      } else if (exportFormat === 'csv') {
        // Crear los datos CSV
        let csvContent = headers.join(',') + '\n';
        
        // Añadir las filas
        rows.forEach(row => {
          csvContent += row.join(',') + '\n';
        });
        
        // Crear el blob y descargar
        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(csvBlob, `secante_${timestamp}.csv`);
      }
      
      // Cerrar el modal
      setShowExportModal(false);
    } catch (err) {
      console.error("Error al exportar:", err);
      setError("Error al generar el archivo. Por favor, inténtelo de nuevo.");
      setShowErrorModal(true);
    }
  };

  // Función para convertir expresiones evaluables de vuelta a formato LaTeX
  const convertToLatex = (expr) => {
    if (!expr) return '';
    
    // Intentar recuperar el LaTeX original del localStorage
    const equationLatex = localStorage.getItem('secante_equation_latex');
    
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
      <h2 className="method-title">Método de la Secante</h2>
      
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
      
      {/* Modal de Exportación */}
      <Modal
        show={showExportModal}
        onHide={handleCloseExportModal}
        centered
        className="export-modal"
      >
        <Modal.Header className="export-modal-header">
          <Modal.Title className="export-modal-title">
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            Exportar Resultados
          </Modal.Title>
          <Button 
            variant="link" 
            className="export-close-btn" 
            onClick={handleCloseExportModal}
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </Modal.Header>
        <Modal.Body className="export-modal-body">
          <Form>
            <Form.Group className="mb-4">
              <Form.Label>Formato de exportación</Form.Label>
              <div className="d-flex">
                <Form.Check
                  type="radio"
                  id="export-excel"
                  name="exportFormat"
                  label="Excel (.xlsx)"
                  checked={exportFormat === 'excel'}
                  onChange={() => handleExportFormatChange('excel')}
                  className="me-4"
                />
                <Form.Check
                  type="radio"
                  id="export-csv"
                  name="exportFormat"
                  label="CSV (.csv)"
                  checked={exportFormat === 'csv'}
                  onChange={() => handleExportFormatChange('csv')}
                />
              </div>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label>Columnas a incluir</Form.Label>
                <div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={handleSelectAllColumns}
                    className="p-0 me-2"
                  >
                    Seleccionar todo
                  </Button>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={handleDeselectAllColumns}
                    className="p-0"
                  >
                    Deseleccionar todo
                  </Button>
                </div>
              </div>
              
              <div className="column-selection">
                {availableColumns.map(column => (
                  <Form.Check
                    key={column.id}
                    type="checkbox"
                    id={`column-${column.id}`}
                    label={column.label}
                    checked={selectedColumns[column.id] || false}
                    onChange={() => handleColumnToggle(column.id)}
                    className="mb-2"
                  />
                ))}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="export-modal-footer">
          <Button variant="secondary" onClick={handleCloseExportModal}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleExport}
            disabled={Object.values(selectedColumns).every(v => !v)}
          >
            Exportar
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
                  <Form.Label>Primera aproximación (x₀)</Form.Label>
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
                  <Form.Label>Segunda aproximación (x₁)</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    name="x1"
                    value={formData.x1}
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
                    {result.iterations || 0}
                  </p>
                </div>
                
                <div className="result-item">
                  <h4>Convergencia:</h4>
                  <p className={`result-value ${result.converged ? 'text-success' : 'text-danger'}`}>
                    {result.converged ? 'Sí' : 'No'}
                  </p>
                </div>
              </div>
              
              <div className="result-message">
                <h4>Mensaje:</h4>
                <p>{result.message || 'No hay mensaje disponible'}</p>
              </div>
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="iterations-title mb-0">Tabla de Iteraciones</h4>
                <DropdownButton
                  as={ButtonGroup}
                  title={
                    <span>
                      <FontAwesomeIcon icon={faDownload} className="me-2" />
                      Exportar
                    </span>
                  }
                  variant="outline-primary"
                  className="export-dropdown"
                >
                  <Dropdown.Item onClick={handleOpenExportModal}>
                    <FontAwesomeIcon icon={faTable} className="me-2" />
                    Personalizar exportación
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item 
                    onClick={() => {
                      setExportFormat('excel');
                      handleSelectAllColumns();
                      handleExport();
                    }}
                  >
                    <FontAwesomeIcon icon={faFileExcel} className="me-2" />
                    Exportar a Excel
                  </Dropdown.Item>
                  <Dropdown.Item 
                    onClick={() => {
                      setExportFormat('csv');
                      handleSelectAllColumns();
                      handleExport();
                    }}
                  >
                    <FontAwesomeIcon icon={faFileCsv} className="me-2" />
                    Exportar a CSV
                  </Dropdown.Item>
                </DropdownButton>
              </div>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Iteración</th>
                      <th>x<sub>prev</sub></th>
                      <th>x<sub>curr</sub></th>
                      <th>x<sub>next</sub></th>
                      <th>f(x<sub>prev</sub>)</th>
                      <th>f(x<sub>curr</sub>)</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.all_iterations && result.all_iterations.map((iter, index) => (
                      <tr key={index}>
                        <td>{iter.iteration}</td>
                        <td>{safeToFixed(iter.x_prev)}</td>
                        <td>{safeToFixed(iter.x_curr)}</td>
                        <td>{safeToFixed(iter.x_next)}</td>
                        <td>{safeToFixed(iter.f_prev)}</td>
                        <td>{safeToFixed(iter.f_curr)}</td>
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

export default Secante;