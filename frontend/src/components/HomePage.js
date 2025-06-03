import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
  const metodos = [
    {
      id: 'punto-fijo',
      name: 'Punto Fijo',
      description: 'Método iterativo para encontrar raíces de ecuaciones',
      icon: '📍',
      available: true
    },
    {
      id: 'biseccion',
      name: 'Bisección',
      description: 'Método que divide intervalos para encontrar raíces',
      icon: '✂️',
      available: true
    },
    {
      id: 'newton-raphson',
      name: 'Newton-Raphson',
      description: 'Método basado en la derivada de la función',
      icon: '🔄',
      available: true
    },
    {
      id: 'secante',
      name: 'Secante',
      description: 'Aproximación lineal entre dos puntos',
      icon: '📉',
      available: true
    },
    {
      id: 'jacobi',
      name: 'Jacobi',
      description: 'Método iterativo para resolver sistemas de ecuaciones lineales',
      icon: '🔢',
      available: true
    },
    {
      id: 'gauss-seidel',
      name: 'Gauss-Seidel',
      description: 'Método iterativo mejorado para sistemas de ecuaciones lineales',
      icon: '🧮',
      available: true
    },
    {
      id: 'trapecio',
      name: 'Trapecio',
      description: 'Método de integración numérica basado en aproximación lineal',
      icon: '∫',
      available: true
    },
    {
      id: 'simpson',
      name: 'Simpson',
      description: 'Método de integración numérica basado en aproximación cuadrática',
      icon: '∫',
      available: true
    },
    {
      id: 'romberg',
      name: 'Romberg',
      description: 'Método de integración numérica basado en extrapolación de Richardson',
      icon: '∫',
      available: true
    },
    {
      id: 'broyden',
      name: 'Broyden',
      description: 'Método cuasi-Newton para encontrar raíces de ecuaciones',
      icon: '🔄',
      available: true
    }
  ];

  return (
    <div className="home-container">
      <h2 className="home-title">Calculadora de Métodos Numéricos</h2>
      <p className="home-description">
        Selecciona un método numérico para resolver ecuaciones y encontrar raíces.
      </p>
      
      <div className="metodos-grid">
        {metodos.map((metodo) => (
          <Link 
            key={metodo.id}
            to={metodo.available ? `/metodos/${metodo.id}` : '#'}
            className={`metodo-card ${!metodo.available ? 'disabled' : ''}`}
          >
            <div className="metodo-icon">{metodo.icon}</div>
            <h3 className="metodo-name">{metodo.name}</h3>
            <p className="metodo-description">{metodo.description}</p>
            {!metodo.available && <div className="coming-soon">Próximamente</div>}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomePage;