// Definición de tipos globales para la aplicación
// Agrega aquí las interfaces y tipos de tus entidades de datos

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
