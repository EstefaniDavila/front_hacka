import NetInfo from '@react-native-community/netinfo';
import { api } from '../api';

class NetworkMonitor {
  constructor() {
    this.isConnected = true;
    this.isInternetReachable = true;
    this.connectionType = 'unknown';
    this.listeners = new Set();
    this.isMonitoring = false;
    this.unsubscribeNetInfo = null;
    this.heartbeatInterval = null;
  }

  /**
   * Inicia el monitoreo continuo de conectividad y sondeo de backend
   */
  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // 1. Escuchar cambios de red de NetInfo
    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const prevReachable = this.isInternetReachable;
      this.isConnected = Boolean(state.isConnected);
      this.isInternetReachable = state.isInternetReachable !== false && Boolean(state.isConnected);
      this.connectionType = state.type || 'unknown';

      // Si cambió el estado o recuperamos conexión, notificar
      if (prevReachable !== this.isInternetReachable) {
        this._notifyListeners();
      }
    });

    // 2. Consulta inicial
    NetInfo.fetch().then((state) => {
      this.isConnected = Boolean(state.isConnected);
      this.isInternetReachable = state.isInternetReachable !== false && Boolean(state.isConnected);
      this.connectionType = state.type || 'unknown';
      this._notifyListeners();
    });

    // 3. Heartbeat periódico cada 15 segundos para confirmar accesibilidad real del backend
    this.heartbeatInterval = setInterval(async () => {
      if (!this.isConnected) return;
      try {
        const health = await api.checkHealth();
        const serverAvailable = Boolean(health?.connected);
        if (serverAvailable !== this.isInternetReachable) {
          this.isInternetReachable = serverAvailable;
          this._notifyListeners();
        }
      } catch {
        if (this.isInternetReachable) {
          this.isInternetReachable = false;
          this._notifyListeners();
        }
      }
    }, 15000);
  }

  /**
   * Detiene el monitoreo
   */
  stop() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Comprueba si el dispositivo tiene internet y conexión real al backend
   */
  isOnline() {
    return this.isConnected && this.isInternetReachable !== false;
  }

  /**
   * Suscribe un callback a cambios de estado de red
   * @param {Function} callback Recibe ({ isConnected, isInternetReachable, connectionType, isOnline })
   * @returns {Function} Función para cancelar la suscripción
   */
  subscribe(callback) {
    this.listeners.add(callback);
    // Ejecutar inmediatamente con estado actual
    callback(this.getStatus());
    return () => {
      this.listeners.delete(callback);
    };
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      isInternetReachable: this.isInternetReachable,
      connectionType: this.connectionType,
      isOnline: this.isOnline()
    };
  }

  _notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (err) {
        console.warn('[NetworkMonitor] Error en listener:', err);
      }
    });
  }
}

export const networkMonitor = new NetworkMonitor();

