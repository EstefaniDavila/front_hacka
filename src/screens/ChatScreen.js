import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { customStorage } from '../services/supabase';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SHARED_CONV_ID = '69dea660-5b73-455e-8d7c-70577c624542';


function cleanNeighborName(str) {
  return (str || '')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
export default function ChatScreen({
  fontScale = 1.0,
  onBack,
  initialContact = null,
  onClearInitialContact = null,
  userProfile = null
}) {
  const { session, user } = useAuth();
  const token = session?.access_token;
  const scale = (val) => Math.round(val * fontScale);

  const currentUserName = (userProfile?.name || user?.user_metadata?.full_name || 'Vecino').trim();
  const isImanolUser =
    currentUserName.toLowerCase().includes('imanol') ||
    (user?.email || '').toLowerCase().includes('imanol');

  // Clave de almacenamiento aislada por cuenta activa
  const chatStorageKey =
    'vecired_chats_v7_' +
    (user?.id ? user.id : currentUserName ? currentUserName.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'guest');

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const scrollViewRef = useRef(null);

  // Estados para seguimiento bilateral de servicios y calificaciones
  const [updatingAction, setUpdatingAction] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [chatRating, setChatRating] = useState(5.0);
  const [chatReviewComment, setChatReviewComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  const handleServiceAction = async (action) => {
    if (!token || !selectedChat?.id) return;
    try {
      setUpdatingAction(true);
      const updated = await api.updateServiceAction(selectedChat.id, action, token);
      if (updated) {
        setSelectedChat((prev) => ({
          ...prev,
          service_status: updated.service_status,
          client_confirmed_at: updated.client_confirmed_at,
          provider_confirmed_at: updated.provider_confirmed_at,
          is_service_completed: updated.is_service_completed,
          can_review: updated.can_review,
          my_role: updated.my_role,
          messages: (updated.messages || []).map((m) => ({
            id: String(m.id),
            sender: m.is_me ? 'me' : 'them',
            text: m.text || m.content || '',
            time: m.time || 'Ahora'
          }))
        }));

        if (action === 'confirm' && updated.is_service_completed) {
          Alert.alert('✅ ¡Servicio Culminado!', 'Ambas partes confirmaron la finalización con éxito. Ya puedes calificar la experiencia.');
        } else if (action === 'confirm') {
          Alert.alert('🤝 Confirmación Registrada', 'Has confirmado la finalización. Esperando confirmación de la otra parte para cerrar el servicio.');
        } else if (action === 'agree') {
          Alert.alert('🛠️ Servicio en Progreso', 'Se ha acordado el inicio del trabajo. Al terminar, ambas partes podrán confirmar la finalización.');
        }
      }
    } catch (err) {
      Alert.alert('Atención', err.message || 'No fue posible actualizar el estado del servicio.');
    } finally {
      setUpdatingAction(false);
    }
  };

  const handleSendChatReview = async () => {
    if (!token || !selectedChat?.service_id) return;
    if (!chatReviewComment.trim()) {
      Alert.alert('Comentario necesario', 'Por favor describe brevemente cómo fue la experiencia con el servicio.');
      return;
    }
    try {
      setSubmittingRating(true);
      const intRating = Math.max(1, Math.min(5, Math.round(chatRating)));
      await api.addServiceReview(
        selectedChat.service_id,
        { rating: intRating, comment: chatReviewComment.trim() },
        token
      );
      Alert.alert('⭐ ¡Gracias por tu calificación!', `Tu valoración de ${chatRating.toFixed(1)} estrellas apoya la reputación vecinal.`);
      setShowRatingModal(false);
      setChatReviewComment('');
      setSelectedChat((prev) => ({ ...prev, can_review: false }));
    } catch (err) {
      Alert.alert('Atención', err.message || 'No fue posible registrar tu valoración.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const quickReplies = [
    '¡Hola vecino! Cuenta con mi apoyo 🤝',
    '¿A qué hora te acomoda? ⏰',
    'Ya voy en camino 🚶‍♀️',
    'Muchas gracias vecino 🙏'
  ];

  // Conversaciones iniciales comunitarias según la perspectiva de la cuenta activa
  const getDefaultSeedConversations = () => {
    if (isImanolUser) {
      return [
        {
          id: SHARED_CONV_ID,
          name: 'Andy Manchego',
          avatar: '👨‍🔧',
          badge: 'Proveedor Verificado',
          zone: 'Zona A • Mz 2',
          topic: 'Reparación de computadoras',
          lastMessage: 'Hola Imanol, con gusto te ayudo a revisar la laptop. ¿A qué hora te viene bien?',
          time: '11:20 AM',
          unread: 0,
          phone: '937263104',
          messages: [
            {
              id: 'msg-imanol-1',
              sender: 'me',
              text: '¡Hola Andy! Te escribo desde mi cuenta. Vi que publicaste sobre reparación de computadoras. ¿Podrías apoyarme con la revisión de una laptop?',
              time: '11:15 AM'
            },
            {
              id: 'msg-andy-rep-1',
              sender: 'them',
              text: 'Hola Imanol, con gusto te ayudo a revisar la laptop. ¿A qué hora te viene bien?',
              time: '11:20 AM'
            }
          ]
        },
        {
          id: 'chat-matias-aponte',
          name: 'Matías Aponte',
          avatar: '👷',
          badge: 'Proveedor Verificado',
          zone: 'Zona A • Mz 2',
          topic: 'Albañilería y Pintura',
          lastMessage: '¡Hola vecino Imanol! Avísame si necesitas apoyo con albañilería.',
          time: 'Ayer',
          unread: 0,
          phone: '987654321',
          messages: [
            {
              id: 'msg-matias-1',
              sender: 'them',
              text: '¡Hola vecino Imanol! Avísame si necesitas apoyo con albañilería o pintura.',
              time: 'Ayer'
            }
          ]
        }
      ];
    }

    return [
      {
        id: SHARED_CONV_ID,
        name: 'Imanol Montes',
        avatar: '🧑‍💼',
        badge: 'Vecino Verificado',
        zone: 'Zona A • Mz 2 (Lote 8)',
        topic: 'Reparación de computadoras',
        lastMessage: 'Hola Imanol, con gusto te ayudo a revisar la laptop. ¿A qué hora te viene bien?',
        time: '11:20 AM',
        unread: 0,
        phone: '912345678',
        messages: [
          {
            id: 'msg-imanol-1',
            sender: 'them',
            text: '¡Hola Andy! Te escribo desde mi cuenta. Vi que publicaste sobre reparación de computadoras. ¿Podrías apoyarme con la revisión de una laptop?',
            time: '11:15 AM'
          },
          {
            id: 'msg-andy-rep-1',
            sender: 'me',
            text: 'Hola Imanol, con gusto te ayudo a revisar la laptop. ¿A qué hora te viene bien?',
            time: '11:20 AM'
          }
        ]
      },
      {
        id: 'chat-matias-aponte',
        name: 'Matías Aponte',
        avatar: '👷',
        badge: 'Proveedor Verificado',
        zone: 'Zona A • Mz 2',
        topic: 'Albañilería y Pintura',
        lastMessage: '¡Listo vecino! Mañana a las 9:00 AM paso por tu casa a revisar el trabajo 🛠️',
        time: '10:45 AM',
        unread: 0,
        phone: '987654321',
        messages: [
          {
            id: 'msg-seed-1',
            sender: 'me',
            text: '¡Hola Matías! Vi tu servicio de albañilería y pintura en VeciRed.',
            time: '10:30 AM'
          },
          {
            id: 'msg-seed-2',
            sender: 'them',
            text: '¡Listo vecino! Mañana a las 9:00 AM paso por tu casa a revisar el trabajo 🛠️',
            time: '10:45 AM'
          }
        ]
      },
      {
        id: 'chat-rosa-flores',
        name: 'Rosa Flores',
        avatar: '👩‍🍳',
        badge: 'Vecina de Confianza',
        zone: 'Zona A • Mz 4',
        topic: 'Consulta de Mantenimiento',
        lastMessage: 'Hola Andy, ¿puedes revisar mi laptop más tarde por favor?',
        time: 'Ayer',
        unread: 0,
        phone: '984512309',
        messages: [
          {
            id: 'msg-seed-r1',
            sender: 'them',
            text: 'Hola vecino Andy, buenas tardes. ¿Haces mantenimiento a laptops lentas?',
            time: 'Ayer'
          }
        ]
      }
    ];
  };

  // 1. Cargar conversaciones: Backend PostgreSQL primero, con respaldo en almacenamiento local
  useEffect(() => {
    let mounted = true;

    async function initChats() {
      let list = [];

      // A. Intentar consultar las conversaciones reales del usuario desde el backend
      if (token) {
        try {
          const backendList = await api.getChats(token);
          if (Array.isArray(backendList) && backendList.length > 0) {
            list = backendList.map((c) => {
              const isEmergency = Boolean(c.emergency_id || c.is_emergency);
              return {
                id: String(c.id),
                name: isEmergency ? (c.title || '🚨 Sala de Coordinación') : (c.other_user_name || c.title || 'Vecino'),
                avatar: isEmergency
                  ? '🚨'
                  : c.other_user_avatar ||
                    ((c.other_user_name || '').toLowerCase().includes('andy')
                      ? '👨‍🔧'
                      : (c.other_user_name || '').toLowerCase().includes('mat')
                      ? '👷'
                      : c.is_group
                      ? '👥'
                      : '🧑‍💼'),
                badge: isEmergency
                  ? 'Sala de Emergencia'
                  : c.conversation_type === 'community' || c.conversation_type === 'group' || c.is_group
                  ? 'Chat Comunitario'
                  : c.service_id
                  ? 'Servicio Vecinal'
                  : 'Vecino Verificado',
                zone: isEmergency ? 'Zona de Emergencia' : 'Zona A • Mz 2',
                topic: isEmergency
                  ? (c.emergency_type ? `Emergencia: ${c.emergency_type}` : c.title)
                  : (c.service_title || c.title || 'Coordinación Vecinal'),
                conversation_type: c.conversation_type,
                is_group: Boolean(c.is_group) || isEmergency,
                is_emergency: isEmergency,
                emergency_id: c.emergency_id,
                emergency_type: c.emergency_type,
                emergency_status: c.emergency_status,
                status: c.status || 'active',
                is_admin: Boolean(c.is_admin),
                participants_count: c.participants_count || (isEmergency ? 1 : 2),
                participants: c.participants || [],
                service_id: c.service_id,
                service_title: c.service_title,
                service_status: c.service_status || (c.service_id ? 'contacted' : null),
                initiator_id: c.initiator_id,
                client_confirmed_at: c.client_confirmed_at,
                provider_confirmed_at: c.provider_confirmed_at,
                is_service_completed: c.is_service_completed,
                can_review: c.can_review,
                my_role: c.my_role,
                other_user_id: c.other_user_id,
                lastMessage: c.last_message || 'Conversación iniciada',
                time: c.last_message_time || 'Ahora',
                unread: c.unread_count || 0,
                phone: c.other_user_phone || '937263104',
                messages: []
              };
            });
          }
        } catch (err) {
          console.warn('[ChatScreen] Error consultando backend chats:', err);
        }
      }

      // B. Si el backend aún no retorna lista, consultar storage local
      if (list.length === 0) {
        try {
          const raw = await customStorage.getItem(chatStorageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              list = parsed.filter(
                (c) => c && c.name && c.name.trim().toLowerCase() !== currentUserName.toLowerCase()
              );
            }
          }
        } catch (e) {
          console.warn('[ChatScreen] Error leyendo storage de chats:', e);
        }
      }

      // C. Sembrar conversaciones modelo si está vacío
      if (list.length === 0) {
        list = getDefaultSeedConversations();
      } else {
        const seeds = getDefaultSeedConversations();
        seeds.forEach((seed) => {
          const exists = list.some(
            (c) =>
              c &&
              (c.id === seed.id ||
                (c.name && c.name.trim().toLowerCase() === seed.name.trim().toLowerCase()))
          );
          if (!exists) {
            list.push(seed);
          }
        });
      }

      // Filtrar auto-chat por si acaso
      list = list.filter(
        (c) => c && c.name && c.name.trim().toLowerCase() !== currentUserName.toLowerCase()
      );

      // D1. Si se solicitó abrir una sala de coordinación de emergencia
      if (initialContact && (initialContact.isEmergency || initialContact.emergencyId)) {
        let emergencyChat = list.find(
          (c) =>
            (initialContact.emergencyId && String(c.emergency_id) === String(initialContact.emergencyId)) ||
            (initialContact.conversationId && String(c.id) === String(initialContact.conversationId))
        );

        if (!emergencyChat && token && initialContact.emergencyId) {
          try {
            const emgChat = await api.getEmergencyChat(initialContact.emergencyId, token);
            if (emgChat && emgChat.id) {
              emergencyChat = {
                id: String(emgChat.id),
                name: emgChat.title || '🚨 Sala de Coordinación',
                avatar: '🚨',
                badge: 'Sala de Emergencia',
                zone: 'Zona de Emergencia',
                topic: emgChat.title,
                is_emergency: true,
                is_group: true,
                emergency_id: emgChat.emergency_id,
                emergency_type: emgChat.emergency_type,
                emergency_status: emgChat.emergency_status,
                status: emgChat.status || 'active',
                is_admin: Boolean(emgChat.is_admin),
                participants_count: emgChat.participants_count || 1,
                participants: emgChat.participants || [],
                lastMessage: emgChat.last_message || 'Coordinación iniciada',
                time: emgChat.last_message_time || 'Ahora',
                unread: 0,
                messages: (emgChat.messages || []).map((m) => ({
                  id: String(m.id),
                  sender: m.is_me ? 'me' : 'them',
                  sender_name: m.sender_name || 'Vecino',
                  sender_role: m.sender_role || 'Brigadista',
                  text: m.text || m.content || '',
                  time: m.time || 'Ahora'
                }))
              };
              list.unshift(emergencyChat);
            }
          } catch (e) {
            console.warn('[ChatScreen] Error cargando sala de emergencia:', e);
          }
        }

        if (emergencyChat) {
          if (onClearInitialContact) onClearInitialContact();
          if (mounted) {
            setConversations(list);
            setSelectedChat(emergencyChat);
            setIsLoaded(true);
          }
          return;
        }
      }

      // D. Si se solicitó abrir chat con un contacto específico (desde Servicios o Muro)
      if (initialContact && initialContact.name) {
        const contactName = initialContact.name.trim();

        if (contactName.toLowerCase() === currentUserName.toLowerCase()) {
          Alert.alert(
            'Tu propia publicación',
            'Esta publicación fue creada desde tu cuenta. Para coordinar servicios o apoyos, contacta a otros vecinos de la comunidad.'
          );
          if (onClearInitialContact) onClearInitialContact();
          if (mounted) {
            setConversations(list);
            setSelectedChat(list[0] || null);
            setIsLoaded(true);
          }
          return;
        }

        let targetChat = null;
        if (initialContact.serviceId) {
          targetChat = list.find(
            (c) =>
              c.service_id &&
              String(c.service_id) === String(initialContact.serviceId) &&
              (String(c.other_user_id) === String(initialContact.userId) || cleanNeighborName(c.name) === cleanNeighborName(contactName))
          );
        } else {
          targetChat = list.find(
            (c) =>
              (initialContact.userId && (String(c.other_user_id) === String(initialContact.userId) || String(c.userId) === String(initialContact.userId))) ||
              (c.name && cleanNeighborName(c.name) === cleanNeighborName(contactName))
          );
        }

        if (token && initialContact.userId) {
          try {
            const created = await api.createChat(
              {
                recipient_id: initialContact.userId,
                service_id: initialContact.serviceId || null,
                title: initialContact.serviceTitle || initialContact.topic || 'Coordinación Vecinal',
                initial_message: initialContact.serviceTitle
                  ? `¡Hola vecino! Te contacto por tu servicio "${initialContact.serviceTitle}". ¿Podríamos coordinar los detalles?`
                  : null
              },
              token
            );
            if (created && created.id) {
              const mappedCreated = {
                id: String(created.id),
                name: created.other_user_name || contactName,
                avatar: created.other_user_avatar || initialContact.avatar || '👨‍🔧',
                badge: 'Proveedor Verificado',
                zone: 'Zona A',
                topic: created.service_title || created.title || initialContact.topic || 'Coordinación Vecinal',
                service_id: created.service_id,
                service_title: created.service_title,
                service_status: created.service_status || 'contacted',
                initiator_id: created.initiator_id,
                client_confirmed_at: created.client_confirmed_at,
                provider_confirmed_at: created.provider_confirmed_at,
                is_service_completed: created.is_service_completed,
                can_review: created.can_review,
                my_role: created.my_role,
                other_user_id: created.other_user_id || initialContact.userId,
                lastMessage: created.last_message || 'Conversación iniciada',
                time: created.last_message_time || 'Ahora',
                unread: 0,
                phone: created.other_user_phone || initialContact.phone || '937263104',
                messages: (created.messages || []).map((m) => ({
                  id: String(m.id),
                  sender: m.is_me ? 'me' : 'them',
                  text: m.text || m.content || '',
                  time: m.time || 'Ahora'
                }))
              };
              targetChat = mappedCreated;
              list = [mappedCreated, ...list.filter((c) => String(c.id) !== String(created.id))];
            }
          } catch (e) {
            console.warn('[ChatScreen] Error creando o recuperando chat:', e);
          }
        }

        if (!targetChat) {
          let resolvedId = 'chat-' + (initialContact.id || Date.now());
          targetChat = {
            id: resolvedId,
            name: contactName,
            avatar: initialContact.avatar || '👤',
            badge: initialContact.badge || 'Proveedor Verificado',
            zone: initialContact.zone || 'Zona A',
            topic: initialContact.serviceTitle || initialContact.topic || 'Coordinación Vecinal',
            service_id: initialContact.serviceId || null,
            service_title: initialContact.serviceTitle || null,
            service_status: initialContact.serviceId ? 'contacted' : null,
            lastMessage: `¡Hola! Gracias por contactarme sobre ${initialContact.topic || 'el servicio'}.`,
            time: 'Ahora',
            unread: 0,
            phone: initialContact.phone || '987654321',
            messages: [
              {
                id: 'msg-init-' + Date.now(),
                sender: 'them',
                text: `¡Hola vecino! Gracias por contactarme sobre ${initialContact.topic || 'el servicio'}. ¿En qué te puedo apoyar?`,
                time: 'Ahora'
              }
            ]
          };
          list = [targetChat, ...list.filter((c) => c !== targetChat && cleanNeighborName(c.name) !== cleanNeighborName(contactName))];
        }

        if (mounted) {
          setConversations(list);
          setSelectedChat(targetChat);
          setIsLoaded(true);
        }
      } else {
        if (mounted) {
          setConversations(list);
          setIsLoaded(true);
        }
      }

      try {
        await customStorage.setItem(chatStorageKey, JSON.stringify(list));
      } catch {}
    }

    initChats();

    return () => {
      mounted = false;
    };
  }, [initialContact, currentUserName, token]);

  // 2. Cargar historial y sincronizar en tiempo real (Polling cada 3.5s estilo WhatsApp)
  useEffect(() => {
    if (!selectedChat) return;

    let active = true;

    async function fetchMessages() {
      if (!token) return;
      try {
        const detail = await api.getChatDetail(selectedChat.id, token);
        if (active && detail) {
          const rawMsgs = Array.isArray(detail.messages) ? detail.messages : [];
          const mapped = rawMsgs.map((m) => ({
            id: String(m.id),
            sender: m.is_me ? 'me' : 'them',
            sender_name: m.sender_name || 'Vecino',
            sender_role: m.sender_role || 'Brigadista',
            text: m.text || m.content || '',
            time: m.time || 'Ahora'
          }));

          setSelectedChat((prev) => {
            if (!prev || String(prev.id) !== String(selectedChat.id)) return prev;
            return {
              ...prev,
              emergency_id: detail.emergency_id ?? prev.emergency_id,
              emergency_type: detail.emergency_type ?? prev.emergency_type,
              emergency_status: detail.emergency_status ?? prev.emergency_status,
              status: detail.status ?? prev.status,
              is_emergency: Boolean(detail.emergency_id) || prev.is_emergency,
              is_admin: detail.is_admin ?? prev.is_admin,
              participants_count: detail.participants_count ?? prev.participants_count,
              participants: detail.participants ?? prev.participants,
              service_id: detail.service_id ?? prev.service_id,
              service_title: detail.service_title ?? prev.service_title,
              service_status: detail.service_status ?? prev.service_status,
              client_confirmed_at: detail.client_confirmed_at ?? prev.client_confirmed_at,
              provider_confirmed_at: detail.provider_confirmed_at ?? prev.provider_confirmed_at,
              is_service_completed: detail.is_service_completed ?? prev.is_service_completed,
              can_review: detail.can_review ?? prev.can_review,
              my_role: detail.my_role ?? prev.my_role,
              lastMessage: mapped[mapped.length - 1]?.text || prev.lastMessage,
              messages: mapped
            };
          });
        }
      } catch (e) {
        console.warn('[ChatScreen] Error obteniendo mensajes:', e);
      }
    }

    fetchMessages();

    // Intervalo de actualización en tiempo real mientras el chat esté abierto (cada 3.5s)
    const pollTimer = setInterval(async () => {
      if (!active || !token) return;
      try {
        const detail = await api.getChatDetail(selectedChat.id, token);
        if (active && detail) {
          const rawMsgs = Array.isArray(detail.messages) ? detail.messages : [];
          const mapped = rawMsgs.map((m) => ({
            id: String(m.id),
            sender: m.is_me ? 'me' : 'them',
            sender_name: m.sender_name || 'Vecino',
            sender_role: m.sender_role || 'Brigadista',
            text: m.text || m.content || '',
            time: m.time || 'Ahora'
          }));

          setSelectedChat((prev) => {
            if (!prev || String(prev.id) !== String(selectedChat.id)) return prev;
            return {
              ...prev,
              emergency_id: detail.emergency_id ?? prev.emergency_id,
              emergency_type: detail.emergency_type ?? prev.emergency_type,
              emergency_status: detail.emergency_status ?? prev.emergency_status,
              status: detail.status ?? prev.status,
              is_emergency: Boolean(detail.emergency_id) || prev.is_emergency,
              is_admin: detail.is_admin ?? prev.is_admin,
              participants_count: detail.participants_count ?? prev.participants_count,
              participants: detail.participants ?? prev.participants,
              service_id: detail.service_id ?? prev.service_id,
              service_title: detail.service_title ?? prev.service_title,
              service_status: detail.service_status ?? prev.service_status,
              client_confirmed_at: detail.client_confirmed_at ?? prev.client_confirmed_at,
              provider_confirmed_at: detail.provider_confirmed_at ?? prev.provider_confirmed_at,
              is_service_completed: detail.is_service_completed ?? prev.is_service_completed,
              can_review: detail.can_review ?? prev.can_review,
              my_role: detail.my_role ?? prev.my_role,
              lastMessage: mapped[mapped.length - 1]?.text || prev.lastMessage,
              messages: mapped
            };
          });
        }
      } catch {}
    }, 3500);

    return () => {
      active = false;
      clearInterval(pollTimer);
    };
  }, [selectedChat?.id, token]);

  // 3. Enviar mensaje (Siempre desde la cuenta autenticada propia, sin bots ni simuladores)
  const handleSendMessage = async (textToSend) => {
    const content = textToSend || inputText.trim();
    if (!content || !selectedChat) return;

    const currentChat = selectedChat;

    const newMessage = {
      id: 'msg-' + Date.now(),
      sender: 'me', // Siempre enviado por la cuenta que está navegando
      text: content,
      time: 'Ahora'
    };

    const updatedMessages = [...(currentChat.messages || []), newMessage];
    const chatAfterMsg = {
      ...currentChat,
      lastMessage: content,
      time: 'Ahora',
      messages: updatedMessages
    };

    setSelectedChat(chatAfterMsg);

    const updatedConversations = conversations.map((c) =>
      String(c.id) === String(currentChat.id) ? chatAfterMsg : c
    );
    if (!updatedConversations.some((c) => String(c.id) === String(currentChat.id))) {
      updatedConversations.unshift(chatAfterMsg);
    }

    setConversations(updatedConversations);
    setInputText('');

    // Scroll inmediato hacia el final
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    // Persistir de inmediato en la base de datos PostgreSQL de Supabase con token
    if (token) {
      try {
        await api.sendChatMessage(currentChat.id, content, token);
      } catch (e) {
        console.warn('[ChatScreen] Error enviando mensaje a backend:', e);
      }
    }

    // Persistir localmente en customStorage como respaldo
    try {
      await customStorage.setItem(chatStorageKey, JSON.stringify(updatedConversations));
    } catch (e) {
      console.warn('[ChatScreen] Error guardando mensaje localmente:', e);
    }
  };

  // Restablecer / limpiar historial de chats si el usuario lo desea
  const handleResetChats = () => {
    Alert.alert(
      '¿Restablecer mensajes?',
      'Se reiniciarán tus conversaciones comunitarias con los vecinos del barrio.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            const seeds = getDefaultSeedConversations();
            setConversations(seeds);
            setSelectedChat(null);
            try {
              await customStorage.setItem(chatStorageKey, JSON.stringify(seeds));
            } catch {}
          }
        }
      ]
    );
  };

  // VISTA 1: DETALLE DE CONVERSACIÓN (CHAT ABIERTO CON UN VECINO)
  if (selectedChat) {
    return (
      <View style={styles.chatDetailContainer}>
        {/* Cabecera del Chat con Vecino */}
        <View style={styles.chatDetailHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (onClearInitialContact) onClearInitialContact();
              setSelectedChat(null);
            }}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.primaryDark} />
          </TouchableOpacity>

          <View style={styles.chatHeaderAvatar}>
            <Text style={{ fontSize: 24 }}>{selectedChat.avatar || '👤'}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.chatHeaderName, { fontSize: scale(14) }]}>
                {selectedChat.name}
              </Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color="#ffffff" />
              </View>
            </View>
            <Text style={[styles.chatHeaderSubtitle, { fontSize: scale(10) }]}>
              {selectedChat.is_emergency
                ? (selectedChat.status === 'closed' ? '🔒 Sala Cerrada' : '🟢 Coordinación Activa')
                : `${selectedChat.badge} • ${selectedChat.zone}`}
            </Text>
          </View>

          {/* Botón de Brigadistas o Llamada Rápida */}
          {selectedChat.is_emergency ? (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fee2e2',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 20,
                gap: 5
              }}
              onPress={() => setShowParticipantsModal(true)}
            >
              <Ionicons name="people" size={16} color="#dc2626" />
              <Text style={{ fontSize: scale(11), fontWeight: '800', color: '#dc2626' }}>
                {selectedChat.participants_count || (selectedChat.participants || []).length || 1}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.phoneCallBtn}
              onPress={() =>
                Alert.alert(
                  'Llamada Comunitaria Directa',
                  `¿Deseas llamar a ${selectedChat.name} al ${selectedChat.phone || '912-345-678'} para coordinar?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Llamar', onPress: () => {} }
                  ]
                )
              }
            >
              <Ionicons name="call" size={16} color="#059669" />
            </TouchableOpacity>
          )}
        </View>

        {/* Contenedor que empuja el teclado y mantiene el input visible */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 25}
        >
          {/* Tarjeta de tema / confianza comunitaria */}
          <View style={styles.topicCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="bookmark" size={13} color="#0d9488" />
              <Text style={[styles.topicCardText, { fontSize: scale(11) }]}>
                Tema: <Text style={{ fontWeight: '900', color: COLORS.primaryDeep }}>{selectedChat.topic}</Text>
              </Text>
            </View>
            <Text style={[styles.topicCardSecure, { fontSize: scale(9) }]}>
              🔒 Conversación vecinal segura • Datos protegidos por VeciRed
            </Text>
          </View>

          {/* Tarjeta de Emergencia Grupal */}
          {selectedChat.is_emergency && (
            <View style={{
              backgroundColor: selectedChat.status === 'closed' ? '#f8fafc' : '#fef2f2',
              borderColor: selectedChat.status === 'closed' ? '#cbd5e1' : '#fecaca',
              borderWidth: 1,
              borderRadius: 12,
              padding: 10,
              marginHorizontal: 12,
              marginBottom: 8
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16 }}>{selectedChat.status === 'closed' ? '🔒' : '🚨'}</Text>
                  <Text style={{
                    fontSize: scale(11.5),
                    fontWeight: '800',
                    color: selectedChat.status === 'closed' ? '#475569' : '#991b1b'
                  }}>
                    {selectedChat.status === 'closed' ? 'COORDINACIÓN CONCLUIDA' : 'SALA PRIVADA DE BRIGADA'}
                  </Text>
                </View>
                <View style={{
                  backgroundColor: selectedChat.status === 'closed' ? '#e2e8f0' : '#fee2e2',
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 6
                }}>
                  <Text style={{
                    fontSize: scale(9.5),
                    fontWeight: '800',
                    color: selectedChat.status === 'closed' ? '#475569' : '#dc2626'
                  }}>
                    {selectedChat.status === 'closed' ? 'Solo Lectura' : 'En Atención'}
                  </Text>
                </View>
              </View>
              <Text style={{
                fontSize: scale(10),
                color: selectedChat.status === 'closed' ? '#64748b' : '#7f1d1d',
                marginTop: 4,
                lineHeight: 14
              }}>
                {selectedChat.status === 'closed'
                  ? 'La emergencia ha sido atendida y la coordinación ha finalizado. Los mensajes se conservan intactos para fines históricos.'
                  : `Canal exclusivo entre el reportante (${selectedChat.is_admin ? 'Tú (Admin)' : 'Administrador'}) y la brigada de guardia inscrita.`}
              </Text>
            </View>
          )}

          {/* Tarjeta interactiva de Seguimiento y Confirmación Bilateral del Servicio */}
          {selectedChat.service_id && (
            <View style={styles.serviceTrackingCard}>
              <View style={styles.serviceTrackingHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.serviceTrackingTitle, { fontSize: scale(12) }]} numberOfLines={1}>
                    🛠️ {selectedChat.service_title || selectedChat.topic}
                  </Text>
                  <Text style={[styles.serviceTrackingSub, { fontSize: scale(10) }]}>
                    {selectedChat.service_status === 'contacted' && '🟡 Coordinando atención entre vecinos'}
                    {selectedChat.service_status === 'in_progress' && '🔵 Servicio acordado • En ejecución'}
                    {selectedChat.service_status === 'completed' && '🟢 Finalizado con conformidad de ambas partes'}
                    {selectedChat.service_status === 'cancelled' && '⚪ Servicio cancelado'}
                  </Text>
                </View>

                <View style={[
                  styles.statusBadge,
                  selectedChat.service_status === 'completed' ? styles.statusBadgeCompleted :
                  selectedChat.service_status === 'in_progress' ? styles.statusBadgeProgress : styles.statusBadgeContacted
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {selectedChat.service_status === 'completed' ? 'Finalizado' :
                     selectedChat.service_status === 'in_progress' ? 'En Progreso' : 'Contacto'}
                  </Text>
                </View>
              </View>

              {/* Botones de acción según el estado y rol */}
              <View style={styles.serviceActionRow}>
                {selectedChat.service_status === 'contacted' && (
                  <TouchableOpacity
                    style={styles.actionBtnAgree}
                    onPress={() => handleServiceAction('agree')}
                    disabled={updatingAction}
                  >
                    <Ionicons name="hand-left" size={14} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.actionBtnText}>
                      {updatingAction ? 'Actualizando...' : 'Acordar Inicio del Servicio'}
                    </Text>
                  </TouchableOpacity>
                )}

                {selectedChat.service_status === 'in_progress' && (
                  <View style={{ width: '100%' }}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtnConfirm,
                        ((selectedChat.my_role === 'client' && selectedChat.client_confirmed_at) ||
                         (selectedChat.my_role === 'provider' && selectedChat.provider_confirmed_at)) && { backgroundColor: '#059669', opacity: 0.85 }
                      ]}
                      onPress={() => handleServiceAction('confirm')}
                      disabled={updatingAction ||
                        ((selectedChat.my_role === 'client' && !!selectedChat.client_confirmed_at) ||
                         (selectedChat.my_role === 'provider' && !!selectedChat.provider_confirmed_at))
                      }
                    >
                      <Ionicons name="checkmark-circle" size={15} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.actionBtnText}>
                        {updatingAction ? 'Registrando confirmación...' :
                         ((selectedChat.my_role === 'client' && selectedChat.client_confirmed_at) ||
                          (selectedChat.my_role === 'provider' && selectedChat.provider_confirmed_at))
                          ? '✅ Ya confirmaste tu conformidad'
                          : 'Confirmar Finalización del Trabajo'}
                      </Text>
                    </TouchableOpacity>

                    {(!selectedChat.client_confirmed_at || !selectedChat.provider_confirmed_at) && (
                      <Text style={styles.serviceWaitNotice}>
                        {(selectedChat.my_role === 'client' && selectedChat.client_confirmed_at)
                          ? 'Esperando que el proveedor confirme para completar el registro.'
                          : (selectedChat.my_role === 'provider' && selectedChat.provider_confirmed_at)
                          ? 'Esperando que el cliente confirme para completar y calificar.'
                          : 'Ambas partes deben confirmar la finalización del servicio.'}
                      </Text>
                    )}
                  </View>
                )}

                {selectedChat.service_status === 'completed' && (
                  <View style={{ width: '100%', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.serviceCompletedText}>
                      🎉 ¡Servicio culminado con satisfacción mutua!
                    </Text>
                    {(selectedChat.can_review || selectedChat.my_role === 'client') && (
                      <TouchableOpacity
                        style={styles.actionBtnReview}
                        onPress={() => setShowRatingModal(true)}
                      >
                        <Ionicons name="star" size={15} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.actionBtnText}>⭐ Calificar Servicio Vecinal</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Modal / Card para Calificar el Servicio completado */}
          {showRatingModal && (
            <View style={styles.chatReviewCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={[styles.chatReviewTitle, { fontSize: scale(12) }]}>
                  Calificar a {selectedChat.name}
                </Text>
                <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                  <Ionicons name="close" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 8 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setChatRating(star)}>
                    <Ionicons
                      name={chatRating >= star ? "star" : "star-outline"}
                      size={28}
                      color={chatRating >= star ? "#f59e0b" : "#cbd5e1"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ textAlign: 'center', fontSize: scale(10), color: '#475569', marginBottom: 6 }}>
                {chatRating === 5 && '⭐⭐⭐⭐⭐ ¡Excelente atención!'}
                {chatRating === 4 && '⭐⭐⭐⭐ Muy buen servicio'}
                {chatRating === 3 && '⭐⭐⭐ Buen trabajo'}
                {chatRating <= 2 && '⭐⭐ Regular / Por mejorar'}
                {' '}({chatRating.toFixed(1)} / 5.0)
              </Text>

              <TextInput
                style={[styles.chatReviewInput, { fontSize: scale(11) }]}
                placeholder="Escribe tu recomendación para la comunidad (ej. Llegó puntual y resolvió el problema)..."
                placeholderTextColor="#94a3b8"
                value={chatReviewComment}
                onChangeText={setChatReviewComment}
                multiline
                numberOfLines={2}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  style={styles.cancelRatingBtn}
                  onPress={() => setShowRatingModal(false)}
                  disabled={submittingRating}
                >
                  <Text style={styles.cancelRatingBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitRatingBtn}
                  onPress={handleSendChatReview}
                  disabled={submittingRating}
                >
                  <Text style={styles.submitRatingBtnText}>
                    {submittingRating ? 'Enviando...' : 'Publicar Calificación'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Lista de Mensajes con scroll automático al escribir */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {(selectedChat.messages || []).map((msg) => {
              const isMe = msg.sender === 'me';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    isMe ? styles.messageRowMe : styles.messageRowThem
                  ]}
                >
                  {/* Avatar del vecino para mensajes entrantes */}
                  {!isMe && (
                    <View style={styles.bubbleSenderAvatar}>
                      <Text style={{ fontSize: 16 }}>{selectedChat.avatar || '👤'}</Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.messageBubble,
                      isMe ? styles.bubbleMe : styles.bubbleThem
                    ]}
                  >
                    {!isMe && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                        <Text style={[styles.bubbleSenderName, { fontSize: scale(10.5) }]}>
                          {msg.sender_name || selectedChat.name}
                        </Text>
                        {(selectedChat.is_emergency || selectedChat.is_group) && (
                          <View style={{
                            backgroundColor: (msg.sender_role || '').toLowerCase().includes('admin') ? '#fee2e2' : '#e0e7ff',
                            paddingHorizontal: 4,
                            paddingVertical: 1,
                            borderRadius: 4
                          }}>
                            <Text style={{
                              fontSize: scale(8.5),
                              fontWeight: '700',
                              color: (msg.sender_role || '').toLowerCase().includes('admin') ? '#dc2626' : '#4338ca'
                            }}>
                              {(msg.sender_role || '').toLowerCase().includes('admin') ? '👑 Admin' : '🛡️ Brigadista'}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                    <Text
                      style={[
                        styles.messageText,
                        isMe ? styles.messageTextMe : styles.messageTextThem,
                        { fontSize: scale(13) }
                      ]}
                    >
                      {msg.text}
                    </Text>
                    <View style={styles.messageFooter}>
                      <Text
                        style={[
                          styles.messageTime,
                          isMe ? styles.messageTimeMe : styles.messageTimeThem,
                          { fontSize: scale(9) }
                        ]}
                      >
                        {msg.time}
                      </Text>
                      {isMe && (
                        <Text style={[styles.checkmarks, { fontSize: scale(10) }]}>
                          {' '}✓✓
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Respuestas Rápidas Sugeridas */}
          <View style={styles.quickRepliesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 10, gap: 6 }}
            >
              {quickReplies.map((qr, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickReplyPill}
                  onPress={() => handleSendMessage(qr)}
                >
                  <Text style={[styles.quickReplyText, { fontSize: scale(10) }]}>
                    {qr}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Barra de Entrada de Texto estilo WhatsApp o Banner de Sala Cerrada */}
          {selectedChat.status === 'closed' ? (
            <View style={{
              padding: 16,
              backgroundColor: '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
              borderTopWidth: 1,
              borderTopColor: '#e2e8f0'
            }}>
              <Text style={{ fontSize: scale(12), color: '#475569', fontWeight: '800' }}>
                🔒 Sala de Emergencia Cerrada (Solo Lectura)
              </Text>
              <Text style={{ fontSize: scale(10.5), color: '#64748b', marginTop: 2, textAlign: 'center' }}>
                La coordinación de esta emergencia fue finalizada. No se admiten nuevos mensajes.
              </Text>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, { fontSize: scale(13) }]}
                placeholder={selectedChat.is_emergency ? "Coordinar auxilio con la brigada..." : `Escribe un mensaje a ${selectedChat.name}...`}
                placeholderTextColor={COLORS.textMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSendMessage()}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && { opacity: 0.6 }
                ]}
                disabled={!inputText.trim()}
                onPress={() => handleSendMessage()}
              >
                <Ionicons name="send" size={17} color="#ffffff" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>

        {/* Modal de Participantes de la Sala de Emergencia */}
        <Modal
          visible={showParticipantsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowParticipantsModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}>
            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 360,
              padding: 20,
              elevation: 5
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: scale(14), fontWeight: '900', color: COLORS.primaryDark }}>
                  👥 Brigada de Coordinación
                </Text>
                <TouchableOpacity onPress={() => setShowParticipantsModal(false)}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: scale(11), color: '#64748b', marginBottom: 12 }}>
                Participantes autorizados coordinando auxilio para esta emergencia:
              </Text>

              <ScrollView style={{ maxHeight: 220 }}>
                {(selectedChat.participants && selectedChat.participants.length > 0 ? selectedChat.participants : [
                  { user_id: 'rep', name: 'Vecino Reportante', role: 'admin', is_active: true },
                  { user_id: 'me', name: currentUserName + ' (Tú)', role: 'brigadista', is_active: true }
                ]).map((part, idx) => (
                  <View key={idx} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f1f5f9'
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 18 }}>{part.avatar || '👤'}</Text>
                      <View>
                        <Text style={{ fontSize: scale(12), fontWeight: '700', color: COLORS.primaryDark }}>
                          {part.name}
                        </Text>
                        <Text style={{ fontSize: scale(9.5), color: '#64748b' }}>
                          {part.role === 'admin' ? '👑 Creador / Reportante' : '🛡️ Brigadista de Guardia'}
                        </Text>
                      </View>
                    </View>
                    <View style={{
                      backgroundColor: part.role === 'admin' ? '#fee2e2' : '#ecfdf5',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6
                    }}>
                      <Text style={{
                        fontSize: scale(9),
                        fontWeight: '700',
                        color: part.role === 'admin' ? '#dc2626' : '#059669'
                      }}>
                        {part.role === 'admin' ? 'Admin' : 'Activo'}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.primaryDark,
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: 'center',
                  marginTop: 16
                }}
                onPress={() => setShowParticipantsModal(false)}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: scale(12) }}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // VISTA 2: LISTA DE MENSAJES Y CHATS ACTIVOS
  return (
    <View style={styles.container}>
      {/* Cabecera Principal de Chats */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {onBack && (
              <TouchableOpacity onPress={onBack}>
                <Ionicons name="arrow-back" size={22} color={COLORS.primaryDark} />
              </TouchableOpacity>
            )}
            <View>
              <Text style={[styles.headerTitle, { fontSize: scale(17) }]}>
                💬 Mensajes Comunitarios
              </Text>
              <Text style={[styles.headerSub, { fontSize: scale(11) }]}>
                Coordinación directa entre vecinos verificados
              </Text>
            </View>
          </View>

          {/* Botón para reiniciar/limpiar chats */}
          <TouchableOpacity
            style={styles.resetHeaderBtn}
            activeOpacity={0.8}
            onPress={handleResetChats}
          >
            <Ionicons name="refresh-outline" size={15} color={COLORS.primaryDark} style={{ marginRight: 3 }} />
            <Text style={[styles.resetHeaderBtnText, { fontSize: scale(10) }]}>Restablecer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {conversations.length === 0 ? (
          <View style={styles.emptyListBox}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>💬</Text>
            <Text style={[styles.emptyListTitle, { fontSize: scale(15) }]}>
              No tienes mensajes comunitarios
            </Text>
            <Text style={[styles.emptyListSub, { fontSize: scale(12) }]}>
              Cuando te comuniques con un vecino desde Servicios o el Muro Solidario, tus conversaciones aparecerán aquí para coordinar directamente.
            </Text>
          </View>
        ) : (
          conversations.map((conv) => (
            <TouchableOpacity
              key={conv.id}
              style={styles.conversationCard}
              activeOpacity={0.8}
              onPress={() => setSelectedChat(conv)}
            >
              <View style={styles.convAvatarCircle}>
                <Text style={{ fontSize: 26 }}>{conv.avatar || '👤'}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.convTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.convName, { fontSize: scale(13) }]}>
                      {conv.name}
                    </Text>
                    {conv.is_emergency ? (
                      <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, color: '#dc2626', fontWeight: '800' }}>🚨 Emergencia</Text>
                      </View>
                    ) : conv.is_group ? (
                      <View style={{ backgroundColor: '#e0e7ff', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, color: '#3730a3', fontWeight: '700' }}>Grupo</Text>
                      </View>
                    ) : conv.service_id ? (
                      <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, color: '#92400e', fontWeight: '700' }}>Servicio</Text>
                      </View>
                    ) : (
                      <View style={styles.verifiedMini}>
                        <Ionicons name="checkmark" size={8} color="#ffffff" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.convTime, { fontSize: scale(10) }]}>
                    {conv.time}
                  </Text>
                </View>

                <Text style={[styles.convTopic, { fontSize: scale(10) }]}>
                  {conv.is_emergency ? `🚨 ${conv.topic} • 👥 ${conv.participants_count || 1} brigadistas` : `📌 ${conv.topic}`}
                </Text>
                <Text
                  style={[
                    styles.convLastMessage,
                    conv.unread > 0 && styles.convLastMessageUnread,
                    { fontSize: scale(11) }
                  ]}
                  numberOfLines={1}
                >
                  {conv.lastMessage}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#94a3b8" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  headerTitle: {
    fontWeight: '900',
    color: COLORS.primaryDark
  },
  headerSub: {
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2
  },
  resetHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  resetHeaderBtnText: {
    fontWeight: '700',
    color: COLORS.primaryDark
  },
  listContent: {
    padding: 16,
    paddingBottom: 80
  },
  emptyListBox: {
    backgroundColor: COLORS.white,
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 20
  },
  emptyListTitle: {
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyListSub: {
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  convAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  convName: {
    fontWeight: '800',
    color: COLORS.text
  },
  convTime: {
    color: COLORS.textMuted,
    fontWeight: '500'
  },
  convTopic: {
    color: '#0d9488',
    fontWeight: '700',
    marginBottom: 3
  },
  convLastMessage: {
    color: COLORS.textMuted,
    fontWeight: '500'
  },
  convLastMessageUnread: {
    color: COLORS.text,
    fontWeight: '800'
  },
  verifiedMini: {
    backgroundColor: '#059669',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chatDetailContainer: {
    flex: 1,
    backgroundColor: '#f0fdf4'
  },
  chatDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  backButton: {
    padding: 6,
    marginRight: 6
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  chatHeaderName: {
    fontWeight: '800',
    color: COLORS.text
  },
  verifiedBadge: {
    backgroundColor: '#059669',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chatHeaderSubtitle: {
    color: COLORS.textMuted,
    fontWeight: '600'
  },
  phoneCallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  topicCard: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#ccfbf1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  topicCardText: {
    color: '#0f766e',
    fontWeight: '700'
  },
  topicCardSecure: {
    color: '#0d9488',
    fontWeight: '600'
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 14
  },
  messagesContent: {
    paddingVertical: 14,
    gap: 8
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4
  },
  messageRowMe: {
    justifyContent: 'flex-end'
  },
  messageRowThem: {
    justifyContent: 'flex-start'
  },
  bubbleSenderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginBottom: 2
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18
  },
  bubbleMe: {
    backgroundColor: '#0d9488',
    borderBottomRightRadius: 4
  },
  bubbleThem: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  bubbleSenderName: {
    fontWeight: '800',
    color: '#0f766e',
    marginBottom: 2
  },
  messageText: {
    lineHeight: 18,
    fontWeight: '500'
  },
  messageTextMe: {
    color: '#ffffff'
  },
  messageTextThem: {
    color: '#1e293b'
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 3
  },
  messageTime: {
    fontWeight: '500'
  },
  messageTimeMe: {
    color: '#ccfbf1'
  },
  messageTimeThem: {
    color: '#94a3b8'
  },
  checkmarks: {
    color: '#a7f3d0',
    fontWeight: '800'
  },
  quickRepliesContainer: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  quickReplyPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  quickReplyText: {
    fontWeight: '700',
    color: COLORS.primaryDark
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: COLORS.text,
    minHeight: 40
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3
  },
  serviceTrackingCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2
  },
  serviceTrackingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8
  },
  serviceTrackingTitle: {
    fontWeight: '800',
    color: '#0f172a'
  },
  serviceTrackingSub: {
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  statusBadgeContacted: {
    backgroundColor: '#fef3c7'
  },
  statusBadgeProgress: {
    backgroundColor: '#e0f2fe'
  },
  statusBadgeCompleted: {
    backgroundColor: '#dcfce7'
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1e293b'
  },
  serviceActionRow: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8
  },
  actionBtnAgree: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8
  },
  actionBtnConfirm: {
    backgroundColor: '#0d9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8
  },
  actionBtnReview: {
    backgroundColor: '#d97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%'
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12
  },
  serviceWaitNotice: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic'
  },
  serviceCompletedText: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '700',
    textAlign: 'center'
  },
  chatReviewCard: {
    backgroundColor: '#f8fafc',
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1'
  },
  chatReviewTitle: {
    fontWeight: '800',
    color: '#1e293b'
  },
  chatReviewInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
    minHeight: 50,
    color: '#1e293b'
  },
  cancelRatingBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f1f5f9'
  },
  cancelRatingBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b'
  },
  submitRatingBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#0d9488'
  },
  submitRatingBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff'
  }
});
