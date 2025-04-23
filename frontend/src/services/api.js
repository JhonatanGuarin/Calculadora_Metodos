import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Crear una instancia de axios con la URL base
const api = axios.create({
  baseURL: API_URL,
});

// Funciones para interactuar con la API
export const metodosPuntoFijo = {
  solve: async (data) => {
    try {
      const response = await api.post('/metodos/punto-fijo', data);
      return response.data;
    } catch (error) {
      console.error('Error en la solicitud de punto fijo:', error);
      throw error;
    }
  }
};

export const metodosBiseccion = {
  solve: async (data) => {
    try {
      const response = await api.post('/metodos/biseccion', data);
      return response.data;
    } catch (error) {
      console.error('Error en la solicitud de bisección:', error);
      throw error;
    }
  }
};

export const metodosNewtonRaphson = {
  solve: async (data) => {
    try {
      const response = await api.post('/metodos/newton-raphson', data);
      return response.data;
    } catch (error) {
      console.error('Error en la solicitud de Newton-Raphson:', error);
      throw error;
    }
  }
};

export const metodosSecante = {
  solve: async (data) => {
    try {
      const response = await api.post('/metodos/secante', data);
      return response.data;
    } catch (error) {
      console.error('Error en la solicitud de Secante:', error);
      throw error;
    }
  }
};

export const metodosJacobi = {
  solve: async (data) => {
    try {
      const response = await api.post('/metodos/jacobi', data);
      return response.data;
    } catch (error) {
      console.error('Error en la solicitud de Jacobi:', error);
      throw error;
    }
  }
};

export const metodosGaussSeidel = {
  solve: async (data) => {
    try {
      const response = await api.post('/metodos/gauss-seidel', data);
      return response.data;
    } catch (error) {
      console.error('Error en la solicitud de Gauss-Seidel:', error);
      throw error;
    }
  }
};

export const health = {
  check: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error al verificar la salud de los servicios:', error);
      throw error;
    }
  }
};

export default api;