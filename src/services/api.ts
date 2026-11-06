// Cliente de llamadas a la API / Backend
// Puedes reemplazar la URL base y conectar con tu servidor

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.ejemplo.com';

export async function fetchClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Error en la petición: ${response.statusText}`);
  }

  return response.json();
}

// Ejemplo de funciones de servicio listas para usar:
export const apiService = {
  getUsers: () => fetchClient('/users'),
  // createUser: (data: unknown) => fetchClient('/users', { method: 'POST', body: JSON.stringify(data) }),
};
