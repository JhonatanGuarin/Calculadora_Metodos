import React, { useEffect, useRef } from 'react';
import '../styles/FunctionGraph.css';

const FunctionGraph = ({ equation }) => {
  const ggbAppRef = useRef(null);
  const containerRef = useRef(null);
  const appletInitialized = useRef(false);

  useEffect(() => {
    // Solo cargar GeoGebra si no está ya inicializado
    if (!appletInitialized.current) {
      loadGeoGebra();
    } else if (equation) {
      updateGraph(equation);
    }
  }, [equation]);

  const loadGeoGebra = () => {
    // Verificar si GeoGebra ya está cargado
    if (window.GGBApplet) {
      initGeoGebra();
      return;
    }

    // Cargar el script de GeoGebra
    const script = document.createElement('script');
    script.src = 'https://www.geogebra.org/apps/deployggb.js';
    script.async = true;
    script.onload = initGeoGebra;
    document.body.appendChild(script);
  };

  const initGeoGebra = () => {
    const params = {
      id: 'ggbApplet',
      width: containerRef.current.offsetWidth,
      height: 400,
      showMenuBar: false,
      showAlgebraInput: true,  // Mostrar entrada algebraica para depuración
      showToolBar: false,
      showToolBarHelp: false,
      showResetIcon: true,
      enableLabelDrags: false,
      enableShiftDragZoom: true,
      enableRightClick: false,
      errorDialogsActive: false,  // Activar diálogos de error para depuración
      useBrowserForJS: true,
      allowStyleBar: false,
      preventFocus: false,
      showZoomButtons: true,
      capturingThreshold: 3,
      appletOnLoad: () => {
        appletInitialized.current = true;
        if (equation) {
          updateGraph(equation);
        }
      },
      appName: 'classic',
      // Eliminar material_id para crear un applet vacío
      scaleContainerClass: 'graph-container',
      autoHeight: true
    };

    const ggbApp = new window.GGBApplet(params, true);
    ggbAppRef.current = ggbApp;
    ggbApp.inject('geogebra-container');
  };

  const updateGraph = (equation) => {
    if (!appletInitialized.current || !window.ggbApplet) {
      console.log('GeoGebra no está inicializado aún');
      return;
    }

    try {
      // Limpiar gráficos anteriores
      window.ggbApplet.reset();
      
      // Configurar vista
      window.ggbApplet.evalCommand("SetAxesRatio(1,1)");
      window.ggbApplet.evalCommand("SetGridVisible(true)");
      window.ggbApplet.evalCommand("SetAxesVisible(true, true)");
      
      // Convertir la ecuación a formato GeoGebra
      const geoGebraEquation = convertToGeoGebraFormat(equation);
      
      // Graficar solo f(x)
      if (geoGebraEquation) {
        console.log('Graficando:', geoGebraEquation);
        // Usar evalCommand en lugar de setCoordSystem
        window.ggbApplet.evalCommand(`f(x) = ${geoGebraEquation}`);
        window.ggbApplet.evalCommand("SetColor(f, 255, 0, 0)"); // Color rojo para f(x)
        window.ggbApplet.evalCommand("SetLineThickness(f, 3)");
        
        // Ajustar la vista para mostrar la gráfica
        window.ggbApplet.evalCommand("SetCoordinateSystem(-10, 10, -10, 10)");
      }
      
    } catch (error) {
      console.error('Error al actualizar la gráfica:', error);
    }
  };

  // Función para convertir la ecuación a formato GeoGebra
  const convertToGeoGebraFormat = (equation) => {
    if (!equation) return '';
    
    let geoGebraEq = equation;
    
    // Reemplazar operadores de Python a GeoGebra
    geoGebraEq = geoGebraEq.replace(/\*\*/g, '^');  // ** a ^
    geoGebraEq = geoGebraEq.replace(/\*\(/g, '(');  // *(  a (
    
    // Funciones matemáticas
    geoGebraEq = geoGebraEq.replace(/math\./g, '');
    geoGebraEq = geoGebraEq.replace(/np\./g, '');
    
    // Constantes
    geoGebraEq = geoGebraEq.replace(/pi/g, 'π');
    
    // Asegurarse de que sea una expresión en términos de x
    if (!geoGebraEq.includes('x')) {
      geoGebraEq = `${geoGebraEq}`;
    }
    
    return geoGebraEq;
  };

  return (
    <div className="function-graph" ref={containerRef}>
      <div id="geogebra-container" className="graph-container"></div>
      {!equation && (
        <div className="no-equation-message">
          Ingrese una ecuación para visualizar su gráfica
        </div>
      )}
    </div>
  );
};

export default FunctionGraph;