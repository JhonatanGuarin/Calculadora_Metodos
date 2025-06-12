import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Table, Modal, Dropdown, DropdownButton, ButtonGroup } from 'react-bootstrap';
import { metodosEuler } from '../../services/api';
import MathKeyboard from '../MathKeyboard';
import FunctionGraph from '../FunctionGraph';
import '../../styles/Metodos.css';
import 'katex/dist/katex.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes, faDownload, faTable, faFileExcel, faFileCsv } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Euler = () => {
  // Estado para almacenar los datos del formulario
  const [formData, setFormData] = useState({
    equation: '',
    x0: 0,
    y0: 0,
    xf: 1,
    h: 0.1,
    max_steps: 100
  });
  
  // Estado para el valor de h como string (para manejar la entrada de texto)
  const [hValue, setHValue] = useState("0.1");
  
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
    paso: true,
    x: true,
    y: true,
    dy_dx: true
  });
  
  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedEquation = localStorage.getItem('euler_equation');
    const savedX0 = localStorage.getItem('euler_x0');
    const savedY0 = localStorage.getItem('euler_y0');
    const savedXf = localStorage.getItem('euler_xf');
    const savedH = localStorage.getItem('euler_h');
    const savedMaxSteps = localStorage.getItem('euler_max_steps');
    
    if (savedEquation) setFormData(prev => ({ ...prev, equation: savedEquation }));
    if (savedX0) setFormData(prev => ({ ...prev, x0: parseFloat(savedX0) }));
    if (savedY0) setFormData(prev => ({ ...prev, y0: parseFloat(savedY0) }));
    if (savedXf) setFormData(prev => ({ ...prev, xf: parseFloat(savedXf) }));
    if (savedH) {
      setHValue(savedH);
      setFormData(prev => ({ ...prev, h: parseFloat(savedH.replace(',', '.')) }));
    }
    if (savedMaxSteps) setFormData(prev => ({ ...prev, max_steps: parseInt(savedMaxSteps) }));
  }, []);
  
  // Efecto para forzar la recreación de los componentes MathKeyboard cuando se cambia a la pestaña de entrada
  useEffect(() => {
    if (activeTab === 'input') {
      // Incrementar la clave para forzar la recreación de los componentes
      setMathKeyboardsKey(prevKey => prevKey + 1);
    }
  }, [activeTab]);

  // Definición de columnas disponibles para exportar
  const availableColumns = [
    { id: 'paso', label: 'Paso', key: 'paso' },
    { id: 'x', label: 'x', key: 'x' },
    { id: 'y', label: 'y', key: 'y' },
    { id: 'dy_dx', label: 'dy/dx', key: 'dy_dx' }
  ];

  const handleEquationChange = (expr) => {
    // Guardar en el estado
    setFormData({ ...formData, equation: expr });
    
    // Guardar en localStorage
    localStorage.setItem('euler_equation', expr);
    
    // Guardar también el formato original si está disponible
    if (window.lastLatexEquation) {
      localStorage.setItem('euler_equation_latex', window.lastLatexEquation);
    }
  };

  // Manejador específico para el campo h
  const handleHChange = (e) => {
    const value = e.target.value;
    
    // Guardar el valor como string
    setHValue(value);
    
    // Intentar convertir a número para el formData
    try {
      // Reemplazar coma por punto si es necesario
      const normalizedValue = value.toString().replace(',', '.');
      const numValue = parseFloat(normalizedValue);
      
      if (!isNaN(numValue)) {
        setFormData(prev => ({ ...prev, h: numValue }));
      }
    } catch (err) {
      console.error("Error al convertir h a número:", err);
    }
    
    // Guardar en localStorage
    localStorage.setItem('euler_h', value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Convertir a número para campos numéricos
    if (['x0', 'y0', 'xf', 'max_steps'].includes(name)) {
      // Reemplazar coma por punto si es necesario
      const normalizedValue = value.toString().replace(',', '.');
      const parsedValue = name === 'max_steps' ? 
        parseInt(normalizedValue, 10) : 
        parseFloat(normalizedValue);
      
      // Actualizar el estado
      setFormData(prev => ({ ...prev, [name]: parsedValue }));
    } else {
      // Para campos no numéricos
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Guardar en localStorage
    localStorage.setItem(`euler_${name}`, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    setError(null);
    setShowErrorModal(false);
    setResult(null); // Limpiar resultados previos
    
    try {
      // Validar que h sea un número válido
      const hNumValue = parseFloat(hValue.replace(',', '.'));
      if (isNaN(hNumValue) || hNumValue <= 0) {
        throw new Error("El tamaño del paso h debe ser un número positivo");
      }
      
      // Crear una copia del formData para asegurarnos de que los valores son correctos
      const dataToSend = {
        ...formData,
        // Asegurarse de que los valores numéricos son números y no strings
        x0: parseFloat(formData.x0),
        y0: parseFloat(formData.y0),
        xf: parseFloat(formData.xf),
        h: hNumValue, // Usar el valor convertido de hValue
        max_steps: parseInt(formData.max_steps)
      };
      
      console.log("Enviando datos:", dataToSend);
      const response = await metodosEuler.solve(dataToSend);
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
    if (!result || !result.solucion || result.solucion.length === 0) {
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
      const rows = result.solucion.map(paso => {
        return selectedColumnsList.map(col => {
          const value = paso[col.key];
          return value !== null && value !== undefined ? Number(value) : 'N/A';
        });
      });
      
      // Información adicional sobre la solución
      const infoRows = [
        ['Método de Euler - Resultados'],
        ['Ecuación dy/dx = f(x,y):', formData.equation],
        ['Valor inicial x₀:', formData.x0],
        ['Valor inicial y₀:', formData.y0],
        ['Valor final xf:', formData.xf],
        ['Tamaño del paso h:', hValue],
        ['Pasos totales:', result.solucion.length - 1],
        ['Mensaje:', result.mensaje]
      ];
      
      // Timestamp para el nombre del archivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      
      if (exportFormat === 'excel') {
        // Crear una hoja de cálculo con la información general
        const infoWorksheet = XLSX.utils.aoa_to_sheet(infoRows);
        
        // Crear una hoja de cálculo con los datos de los pasos
        const worksheetData = [headers, ...rows];
        const stepsWorksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // Crear un libro de trabajo y añadir las hojas
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, infoWorksheet, 'Información');
        XLSX.utils.book_append_sheet(workbook, stepsWorksheet, 'Pasos');
        
        // Generar el archivo Excel
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Descargar el archivo
        saveAs(data, `euler_${timestamp}.xlsx`);
      } else if (exportFormat === 'csv') {
        // Crear los datos CSV
        let csvContent = headers.join(',') + '\n';
        
        // Añadir las filas
        rows.forEach(row => {
          csvContent += row.join(',') + '\n';
        });
        
        // Crear el blob y descargar
        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(csvBlob, `euler_${timestamp}.csv`);
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
    const equationLatex = localStorage.getItem('euler_equation_latex');
    
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
      <h2 className="method-title">Método de Euler</h2>
      
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
                  <Form.Label>Ecuación diferencial dy/dx = f(x,y)</Form.Label>
                  <div className="equation-info">
                    <p>Ingrese la ecuación diferencial en la forma dy/dx = f(x,y). Por ejemplo, para resolver dy/dx = x + y, ingrese x + y.</p>
                  </div>
                  {/* Usar key para forzar la recreación del componente */}
                  <MathKeyboard 
                    key={`equation-${mathKeyboardsKey}`}
                    onChange={handleEquationChange} 
                    initialValue={convertToLatex(formData.equation)} 
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Valor inicial x₀</Form.Label>
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
                  <Form.Label>Valor inicial y₀</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    name="y0"
                    value={formData.y0}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Valor final xf</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    name="xf"
                    value={formData.xf}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
                
                {/* CAMBIO IMPORTANTE: Usando un input controlado con un estado separado */}
                <Form.Group className="mb-3">
                  <Form.Label>Tamaño del paso h</Form.Label>
                  <Form.Control
                    type="text"
                    value={hValue}
                    onChange={handleHChange}
                    required
                    pattern="[0-9]*[.,]?[0-9]+"
                    inputMode="decimal"
                  />
                  <Form.Text className="text-muted">
                    Valores más pequeños de h producen resultados más precisos pero requieren más cálculos.
                    Use punto o coma como separador decimal (ejemplo: 0.1 o 0,1).
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Máximo de pasos</Form.Label>
                  <Form.Control
                    type="number"
                    name="max_steps"
                    value={formData.max_steps}
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
              
              <div className="result-message mb-4">
                <h4>Mensaje:</h4>
                <p>{result.mensaje || 'No hay mensaje disponible'}</p>
              </div>
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="iterations-title mb-0">Tabla de Pasos</h4>
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
                      <th>Paso</th>
                      <th>x</th>
                      <th>y</th>
                      <th>dy/dx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.solucion && result.solucion.map((paso, index) => (
                      <tr key={index}>
                        <td>{paso.paso}</td>
                        <td>{safeToFixed(paso.x)}</td>
                        <td>{safeToFixed(paso.y)}</td>
                        <td>{safeToFixed(paso.dy_dx)}</td>
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
              <h3 className="graph-title">Gráfico de la Solución</h3>
              <p className="text-muted mb-4">
                El gráfico muestra la solución numérica de la ecuación diferencial usando el método de Euler.
                Los puntos representan los valores calculados en cada paso.
              </p>
              
              {/* Aquí podríamos implementar un gráfico específico para EDOs */}
              {/* Por ahora, usamos el componente FunctionGraph existente */}
              <div className="text-center py-4">
                <p>La visualización de soluciones de ecuaciones diferenciales requiere un gráfico especializado.</p>
                <p>Estamos trabajando en implementar esta funcionalidad.</p>
              </div>
              
              {/* Cuando se implemente un gráfico específico para EDOs:
              <EulerGraph 
                equation={formData.equation}
                x0={formData.x0}
                y0={formData.y0}
                xf={formData.xf}
                h={formData.h}
                solution={result ? result.solucion : null}
              /> */}
            </Card.Body>
          </Card>
        )}
        
      </div>
    </div>
  );
};

export default Euler;