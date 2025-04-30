import React, { useEffect, useRef } from 'react';
import '../styles/FunctionGraph.css';

const FunctionGraph = ({ equation, showTrapezoids = false, a, b, n, result }) => {
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
  }, [equation, showTrapezoids, a, b, n, result]);

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
        
        // Si no estamos mostrando trapecios, usar la vista predeterminada
        if (!showTrapezoids) {
          window.ggbApplet.evalCommand("SetCoordinateSystem(-10, 10, -10, 10)");
        } 
        // Si estamos mostrando trapecios, ajustar la vista a los límites de integración
        else if (a !== undefined && b !== undefined) {
          const padding = (b - a) * 0.2; // 20% de padding
          const yMin = -5;
          const yMax = 15; // Valor arbitrario, podría calcularse basado en los valores de la función
          window.ggbApplet.evalCommand(`SetCoordinateSystem(${a - padding}, ${b + padding}, ${yMin}, ${yMax})`);
          
          // Dibujar los límites de integración
          window.ggbApplet.evalCommand(`a = ${a}`);
          window.ggbApplet.evalCommand(`b = ${b}`);
          window.ggbApplet.evalCommand("SetColor(a, 0, 0, 255)"); // Color azul
          window.ggbApplet.evalCommand("SetColor(b, 0, 0, 255)"); // Color azul
          
          // Dibujar líneas verticales en los límites
          window.ggbApplet.evalCommand(`LineA = Line(a, ${yMin}, a, f(a))`);
          window.ggbApplet.evalCommand(`LineB = Line(b, ${yMin}, b, f(b))`);
          window.ggbApplet.evalCommand("SetColor(LineA, 0, 0, 255)"); // Color azul
          window.ggbApplet.evalCommand("SetColor(LineB, 0, 0, 255)"); // Color azul
          window.ggbApplet.evalCommand("SetLineStyle(LineA, 2)"); // Línea punteada
          window.ggbApplet.evalCommand("SetLineStyle(LineB, 2)"); // Línea punteada
          
          // Si tenemos resultados y n, dibujar los trapecios
          if (result && result.subintervals && n > 0) {
            const width = (b - a) / n;
            
            // Crear un polígono para cada trapecio
            for (let i = 0; i < n; i++) {
              const x1 = a + i * width;
              const x2 = a + (i + 1) * width;
              
              // Obtener los valores y de los puntos
              let y1, y2;
              
              // Si tenemos subintervalos con valores y, usarlos
              if (result.subintervals[i] && result.subintervals[i+1]) {
                y1 = result.subintervals[i].y_value;
                y2 = result.subintervals[i+1].y_value;
              } 
              // Si no, calcular los valores usando la función
              else {
                try {
                  // Evaluar la función en GeoGebra
                  window.ggbApplet.evalCommand(`y1 = f(${x1})`);
                  window.ggbApplet.evalCommand(`y2 = f(${x2})`);
                  y1 = window.ggbApplet.getValue('y1');
                  y2 = window.ggbApplet.getValue('y2');
                } catch (e) {
                  console.error('Error al evaluar la función:', e);
                  y1 = 0;
                  y2 = 0;
                }
              }
              
              // Crear los puntos del trapecio
              window.ggbApplet.evalCommand(`P${i}_1 = (${x1}, 0)`);
              window.ggbApplet.evalCommand(`P${i}_2 = (${x1}, ${y1})`);
              window.ggbApplet.evalCommand(`P${i}_3 = (${x2}, ${y2})`);
              window.ggbApplet.evalCommand(`P${i}_4 = (${x2}, 0)`);
              
              // Crear el polígono (trapecio)
              window.ggbApplet.evalCommand(`trapecio${i} = Polygon(P${i}_1, P${i}_2, P${i}_3, P${i}_4)`);
              
              // Establecer color y transparencia
              window.ggbApplet.evalCommand(`SetColor(trapecio${i}, 0, 128, 255, 0.5)`); // Azul semi-transparente
              window.ggbApplet.evalCommand(`SetFilling(trapecio${i}, 0.3)`); // 30% de opacidad
              
              // Dibujar líneas verticales en cada punto de subdivisión
              if (i > 0 && i < n) {
                window.ggbApplet.evalCommand(`Line${i} = Line(${x1}, 0, ${x1}, f(${x1}))`);
                window.ggbApplet.evalCommand(`SetColor(Line${i}, 0, 128, 0)`); // Verde
                window.ggbApplet.evalCommand(`SetLineStyle(Line${i}, 2)`); // Línea punteada
              }
            }
          }
        }
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