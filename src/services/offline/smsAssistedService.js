import * as SMS from 'expo-sms';
import { getDatabase } from './database';

/**
 * Servicio de SOS asistido por SMS en Expo Go.
 * Utiliza expo-sms para abrir el compositor del sistema con los contactos y el mensaje ya completados,
 * respetando que el envío final lo confirma el usuario.
 */
class SmsAssistedService {
  /**
   * Comprueba si el dispositivo tiene capacidades de SMS asistido
   */
  async isAvailable() {
    try {
      return await SMS.isAvailableAsync();
    } catch (err) {
      console.warn('[SmsAssistedService] Error comprobando disponibilidad SMS:', err);
      return false;
    }
  }

  /**
   * Formatea un mensaje de emergencia ultracompacto para garantizar entrega dentro del estándar de 160 caracteres
   */
  formatSosMessage({
    emergencyType = 'EMERGENCIA',
    latitude,
    longitude,
    accuracyM,
    locationText,
    senderName
  }) {
    const coordsStr = (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null)
      ? `${Number(latitude).toFixed(4)},${Number(longitude).toFixed(4)}${accuracyM ? ` ±${Math.round(accuracyM)}m` : ''}`
      : 'Ubicacion pendiente';

    const cleanLocation = (locationText || 'Arequipa')
      .replace(/Arequipa/gi, 'Aqp')
      .replace(/Distrito/gi, 'Dist.')
      .trim()
      .substring(0, 32);

    const timeStr = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const caller = senderName ? `De: ${senderName.substring(0, 15)} | ` : '';

    const text = `[VECIRED SOS] ${emergencyType.toUpperCase()} | ${caller}Ubic: ${coordsStr} (${cleanLocation}) | ${timeStr} | Requiere auxilio vecinal urgente.`;
    return text.substring(0, 160);
  }

  /**
   * Obtiene los contactos autorizados de la base de datos local
   * ordenados por nivel de distancia (tier 1 = más cercanos)
   */
  async getAuthorizedLocalContacts(maxContacts = 5) {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync(`
        SELECT id, name, phone, role, distance_tier, last_synced_at 
        FROM emergency_contacts 
        WHERE has_sms_consent = 1 AND phone IS NOT NULL AND TRIM(phone) != ''
        ORDER BY distance_tier ASC, last_synced_at DESC
        LIMIT ?;
      `, [maxContacts]);

      return rows || [];
    } catch (err) {
      console.warn('[SmsAssistedService] Error obteniendo contactos locales:', err);
      return [];
    }
  }

  /**
   * Prepara y lanza el compositor de SMS asistido en Expo Go
   * @param {Object} emergencyData Datos de la emergencia
   * @param {Array<string>} [customRecipients] Lista opcional de teléfonos
   * @returns {Promise<{ success: boolean, result: string, recipients: Array<string>, message: string }>}
   */
  async dispatchAssistedSos(emergencyData, customRecipients = null) {
    const available = await this.isAvailable();
    if (!available) {
      return {
        success: false,
        result: 'unavailable',
        recipients: [],
        message: 'El dispositivo no soporta envío de SMS o no tiene app de mensajería configurada.'
      };
    }

    let recipients = customRecipients;
    if (!recipients || recipients.length === 0) {
      const contacts = await this.getAuthorizedLocalContacts(5);
      recipients = contacts.map(c => c.phone.trim()).filter(Boolean);
    }

    if (!recipients || recipients.length === 0) {
      return {
        success: false,
        result: 'no_recipients',
        recipients: [],
        message: 'No hay contactos de emergencia autorizados registrados localmente para enviar la alerta SMS.'
      };
    }

    const messageBody = this.formatSosMessage(emergencyData);

    try {
      // Abre el compositor de SMS nativo prellenado en Expo Go
      const sendResult = await SMS.sendSMSAsync(recipients, messageBody);

      // sendResult.result es 'sent' o 'cancelled' o 'unknown'
      const isSentOrDispatched = sendResult.result === 'sent' || sendResult.result === 'unknown';

      // Actualizar estado en la base de datos local si existe id de emergencia
      if (emergencyData.id) {
        try {
          const db = await getDatabase();
          await db.runAsync(`
            UPDATE local_emergencies 
            SET sms_status = ?, sms_dispatched_at = ?
            WHERE id = ?;
          `, [
            sendResult.result === 'sent' ? 'sms_dispatched_by_user' : 'sms_opened',
            Date.now(),
            emergencyData.id
          ]);
        } catch (dbErr) {
          console.warn('[SmsAssistedService] No se pudo actualizar estado en local_emergencies:', dbErr);
        }
      }

      return {
        success: isSentOrDispatched,
        result: sendResult.result,
        recipients,
        message: sendResult.result === 'sent'
          ? 'Compositor SMS despachado con éxito por el usuario.'
          : 'Compositor de SMS cerrado o cancelado.'
      };
    } catch (err) {
      console.error('[SmsAssistedService] Error al abrir SMS asistido:', err);
      return {
        success: false,
        result: 'error',
        recipients,
        message: err.message || 'Error al desplegar compositor SMS.'
      };
    }
  }
}

export const smsAssistedService = new SmsAssistedService();

