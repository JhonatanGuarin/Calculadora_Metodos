import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Table, Modal, ListGroup, Dropdown, DropdownButton, ButtonGroup } from 'react-bootstrap';
import { metodosBiseccion } from '../../services/api';
import MathKeyboard from '../MathKeyboard';
import FunctionGraph from '../FunctionGraph';
import '../../styles/Metodos.css';
import 'katex/dist/katex.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes, faCheck, faDownload, faTable, faFileExcel, faFileCsv } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Biseccion = () => {
  // Estado para almacenar los datos del formulario
  const [formData, setFormData] = useState({
    equation: '',
    a: 0,
    b: 1,
    tol: 1e-6,
    max_iter: 100,
    seleccionar_raiz: null,
    forzar_busqueda: false
  });
  
  // Estado para controlar la visibilidad de los componentes MathKeyboard
  const [mathKeyboardsKey, setMathKeyboardsKey] = useState(0);
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('input');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showRootSelectionModal, setShowRootSelectionModal] = useState(false);
  const [potentialRoots, setPotentialRoots] = useState([]);
  
  // Estado para el modal de exportación
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [selectedColumns, setSelectedColumns] = useState({
    iteracion: true,
    punto_a: true,
    punto_b: true,
    punto_medio: true,
    error_porcentual: true
  });
  
  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedEquation = localStorage.getItem('biseccion_equation');
    const savedA = localStorage.getItem('biseccion_a');
    const savedB = localStorage.getItem('biseccion_b');
    const savedTol = localStorage.getItem('biseccion_tol');
    const savedMaxIter = localStorage.getItem('biseccion_max_iter');
    const savedForzarBusqueda = localStorage.getItem('biseccion_forzar_busqueda');
    
    if (savedEquation) setFormData(prev => ({ ...prev, equation: savedEquation }));
    if (savedA) setFormData(prev => ({ ...prev, a: parseFloat(savedA) }));
    if (savedB) setFormData(prev => ({ ...prev, b: parseFloat(savedB) }));
    if (savedTol) setFormData(prev => ({ ...prev, tol: parseFloat(savedTol) }));
    if (savedMaxIter) setFormData(prev => ({ ...prev, max_iter: parseInt(savedMaxIter) }));
    if (savedForzarBusqueda) setFormData(prev => ({ ...prev, forzar_busqueda: savedForzarBusqueda === 'true' }));
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
    { id: 'iteracion', label: 'Iteración', key: 'iteracion' },
    { id: 'punto_a', label: 'a', key: 'punto_a' },
    { id: 'punto_b', label: 'b', key: 'punto_b' },
    { id: 'punto_medio', label: 'Punto Medio', key: 'punto_medio' },
    { id: 'error_porcentual', label: 'Error (%)', key: 'error_porcentual' }
  ];

  const handleEquationChange = (expr) => {
    // Asegurarse de que 'e' se interprete como la constante de Euler
    let processedExpr = expr;
    
    // Si la expresión contiene 'e' como variable aislada, reemplazarla por math.e o exp(1)
    // dependiendo del contexto
    if (/\be\b/.test(processedExpr)) {
      console.log("Detectada constante de Euler en la expresión");
      // No necesitamos hacer nada aquí, ya que la función convertLatexToEvaluable
      // en MathKeyboard.js se encargará de la conversión
    }
    
    // Guardar en el estado
    setFormData({ ...formData, equation: processedExpr });
    
    // Guardar en localStorage
    localStorage.setItem('biseccion_equation', processedExpr);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let parsedValue = type === 'checkbox' ? checked : value;
    
    // Convertir a número para campos numéricos
    if (['a', 'b', 'tol', 'max_iter'].includes(name)) {
      parsedValue = name === 'max_iter' ? parseInt(value, 10) : parseFloat(value);
    }
    
    // Actualizar el estado
    setFormData({ ...formData, [name]: parsedValue });
    
    // Guardar en localStorage
    localStorage.setItem(`biseccion_${name}`, type === 'checkbox' ? checked.toString() : value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    setError(null);
    setShowErrorModal(false);
    setResult(null); // Limpiar resultados previos
    
    try {
      console.log("Enviando datos:", formData);
      const response = await metodosBiseccion.solve(formData);
      console.log("Respuesta recibida:", response);
      
      // Verificar si la respuesta contiene un error
      if (response.detail) {
        // Si hay un mensaje de error en la respuesta
        setError(response.detail);
        setShowErrorModal(true);
      } 
      // Verificar si se encontraron múltiples raíces potenciales
      else if (response.raices_potenciales && response.raices_potenciales.length > 0 && response.raiz === null) {
        // Mostrar modal para seleccionar una raíz
        setPotentialRoots(response.raices_potenciales);
        setShowRootSelectionModal(true);
      }
      else {
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

  // Función para seleccionar una raíz y volver a enviar la solicitud
  const handleSelectRoot = async (index) => {
    setShowRootSelectionModal(false);
    setLoading(true);
    
    try {
      // Crear una nueva solicitud con el índice de la raíz seleccionada
      const newRequest = {
        ...formData,
        seleccionar_raiz: index
      };
      
      console.log("Enviando solicitud con raíz seleccionada:", newRequest);
      const response = await metodosBiseccion.solve(newRequest);
      
      // Verificar si la respuesta contiene un error
      if (response.detail) {
        setError(response.detail);
        setShowErrorModal(true);
      } else {
        // Si la respuesta es exitosa
        setResult(response);
        setActiveTab('results'); // Cambiar a la pestaña de resultados
      }
    } catch (err) {
      console.error("Error al seleccionar raíz:", err);
      
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message);
      } else {
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

  // Función para cerrar el modal de selección de raíz
  const handleCloseRootSelectionModal = () => {
    setShowRootSelectionModal(false);
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
    if (!result || !result.pasos || result.pasos.length === 0) {
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
      const rows = result.pasos.map(paso => {
        return selectedColumnsList.map(col => {
          const value = paso[col.key];
          return value !== null && value !== undefined ? Number(value) : 'N/A';
        });
      });
      
      // Información adicional sobre la raíz encontrada
      const infoRows = [
        ['Método de Bisección - Resultados'],
        ['Ecuación:', formData.equation],
        ['Raíz encontrada:', result.raiz !== null ? Number(result.raiz) : 'No encontrada'],
        ['Iteraciones totales:', result.iteraciones],
        ['Tolerancia utilizada:', formData.tol],
        ['Intervalo inicial:', `[${formData.a}, ${formData.b}]`],
        ['Mensaje:', result.mensaje]
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
        saveAs(data, `biseccion_${timestamp}.xlsx`);
      } else if (exportFormat === 'csv') {
        // Crear los datos CSV
        let csvContent = headers.join(',') + '\n';
        
        // Añadir las filas
        rows.forEach(row => {
          csvContent += row.join(',') + '\n';
        });
        
        // Crear el blob y descargar
        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(csvBlob, `biseccion_${timestamp}.csv`);
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
    const equationLatex = localStorage.getItem('biseccion_equation_latex');
    
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
      <h2 className="method-title">Método de Bisección</h2>
      
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
      
      {/* Modal de Selección de Raíz */}
      <Modal
        show={showRootSelectionModal}
        onHide={handleCloseRootSelectionModal}
        centered
        className="root-selection-modal"
      >
        <Modal.Header className="root-selection-modal-header">
          <Modal.Title className="root-selection-modal-title">
            Seleccionar Raíz
          </Modal.Title>
          <Button 
            variant="link" 
            className="root-selection-close-btn" 
            onClick={handleCloseRootSelectionModal}
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </Modal.Header>
        <Modal.Body className="root-selection-modal-body">
          <p>Se encontraron múltiples raíces potenciales en el intervalo. Seleccione una para continuar:</p>
          <ListGroup>
            {potentialRoots.map((root, index) => (
              <ListGroup.Item 
                key={index}
                action
                onClick={() => handleSelectRoot(index)}
                className="root-selection-item"
              >
                <div className="root-info">
                  <span className="root-number">Raíz {index + 1}</span>
                  {root.es_raiz_exacta ? (
                    <span className="root-exact">Raíz exacta: x = {safeToFixed(root.valor_aproximado, 6)}</span>
                  ) : (
                    <span className="root-interval">
                      Intervalo: [{safeToFixed(root.intervalo_inferior, 4)}, {safeToFixed(root.intervalo_superior, 4)}]
                      <br />
                      Aproximación: x ≈ {safeToFixed(root.valor_aproximado, 6)}
                    </span>
                  )}
                </div>
                <FontAwesomeIcon icon={faCheck} className="select-icon" />
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer className="root-selection-modal-footer">
          <Button variant="secondary" onClick={handleCloseRootSelectionModal}>
            Cancelar
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
                
                <div className="form-row">
                  <Form.Group className="mb-3 half-width">
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
                  
                  <Form.Group className="mb-3 half-width">
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
                
                <Form.Group className="mb-3">
                  <Form.Label>Tolerancia</Form.Label>
                  <Form.Select
                    name="tol"
                    value={formData.tol}
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
                    name="max_iter"
                    value={formData.max_iter}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="1000"
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Check
                    type="checkbox"
                    id="forzar-busqueda"
                    name="forzar_busqueda"
                    label="Buscar todas las raíces en el intervalo"
                    checked={formData.forzar_busqueda}
                    onChange={handleInputChange}
                  />
                  <Form.Text className="text-muted">
                    Activa esta opción para buscar todas las posibles raíces en el intervalo, incluso si f(a) y f(b) tienen el mismo signo.
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
                  <h4>Raíz encontrada:</h4>
                  <p className="result-value">
                    {result.raiz !== undefined && result.raiz !== null 
                      ? safeToFixed(result.raiz) 
                      : 'No encontrada'}
                  </p>
                </div>
                
                <div className="result-item">
                  <h4>Iteraciones:</h4>
                  <p className="result-value">
                    {result.iteraciones || 0}
                  </p>
                </div>
              </div>
              
              <div className="result-message">
                <h4>Mensaje:</h4>
                <p>{result.mensaje || 'No hay mensaje disponible'}</p>
              </div>
              
              {/* Mostrar información sobre raíces potenciales si existen */}
              {result.raices_potenciales && result.raices_potenciales.length > 0 && (
                <div className="potential-roots">
                  <h4>Raíces potenciales encontradas:</h4>
                  <ListGroup className="mb-4">
                    {result.raices_potenciales.map((root, index) => (
                      <ListGroup.Item key={index} className={result.seleccionar_raiz === index ? 'selected-root' : ''}>
                        <div className="root-info">
                          <span className="root-number">Raíz {index + 1}</span>
                          {root.es_raiz_exacta ? (
                            <span className="root-exact">Raíz exacta: x = {safeToFixed(root.valor_aproximado, 6)}</span>
                          ) : (
                            <span className="root-interval">
                              Intervalo: [{safeToFixed(root.intervalo_inferior, 4)}, {safeToFixed(root.intervalo_superior, 4)}]
                              <br />
                              Aproximación: x ≈ {safeToFixed(root.valor_aproximado, 6)}
                            </span>
                          )}
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}
              
              {result.pasos && result.pasos.length > 0 && (
                <>
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
                          <th>a</th>
                          <th>b</th>
                          <th>Punto Medio</th>
                          <th>Error (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.pasos.map((paso, index) => (
                          <tr key={index}>
                            <td>{paso.iteracion}</td>
                            <td>{safeToFixed(paso.punto_a, 6)}</td>
                            <td>{safeToFixed(paso.punto_b, 6)}</td>
                            <td>{safeToFixed(paso.punto_medio, 6)}</td>
                            <td>{safeToFixed(paso.error_porcentual)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
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

export default Biseccion;