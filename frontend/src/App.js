import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import PuntoFijo from './components/metodos/PuntoFijo';
import Biseccion from './components/metodos/Biseccion';
import NewtonRaphson from './components/metodos/NewtonRaphson';
import Secante from './components/metodos/Secante';
import Jacobi from './components/metodos/Jacobi';
import GaussSeidel from './components/metodos/GaussSeidel';
import Trapecio from './components/metodos/Trapecio';
import Simpson from './components/metodos/Simpson'; 
import Romberg from './components/metodos/Romberg'; // Añadir importación
import Broyden from './components/metodos/Broyden';
import Euler from './components/metodos/Euler';
import './styles.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/metodos/punto-fijo" element={<PuntoFijo />} />
            <Route path="/metodos/biseccion" element={<Biseccion />} />
            <Route path="/metodos/newton-raphson" element={<NewtonRaphson />} />
            <Route path="/metodos/secante" element={<Secante />} />
            <Route path="/metodos/jacobi" element={<Jacobi />} />
            <Route path="/metodos/gauss-seidel" element={<GaussSeidel />} />
            <Route path="/metodos/trapecio" element={<Trapecio />} />
            <Route path="/metodos/simpson" element={<Simpson />} />
            <Route path="/metodos/romberg" element={<Romberg />} /> {/* Añadir ruta */}
            <Route path="/metodos/broyden" element={<Broyden />} />
            <Route path="/metodos/euler" element={<Euler />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;