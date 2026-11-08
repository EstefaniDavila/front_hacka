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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { customStorage } from '../services/supabase';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SHARED_CONV_ID = '69dea660-5b73-455e-8d7c-70577c624542';

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
            list = backendList.map((c) => ({
              id: String(c.id),
              name: c.other_user_name || c.title || 'Vecino',
              avatar:
                c.other_user_avatar ||
                ((c.other_user_name || '').toLowerCase().includes('andy')
                  ? '👨‍🔧'
                  : (c.other_user_name || '').toLowerCase().includes('mat')
                  ? '👷'
                  : '🧑‍💼'),
              badge: 'Vecino Verificado',
              zone: 'Zona A • Mz 2',
              topic: c.title || 'Coordinación Vecinal',
              lastMessage: c.last_message || 'Conversación iniciada',
              time: c.last_message_time || 'Ahora',
              unread: c.unread_count || 0,
              phone: c.other_user_phone || '937263104',
              messages: []
            }));
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

        let targetChat = list.find(
          (c) =>
            (initialContact.userId && c.other_user_id === initialContact.userId) ||
            (c.name && c.name.trim().toLowerCase() === contactName.toLowerCase())
        );

        if (!targetChat) {
          let resolvedId = 'chat-' + (initialContact.id || Date.now());
          if (token && initialContact.userId) {
            try {
              const created = await api.createChat(
                {
                  recipient_id: initialContact.userId,
                  title: initialContact.topic || 'Coordinación Vecinal'
                },
                token
              );
              if (created && created.id) {
                resolvedId = String(created.id);
              }
            } catch {}
          }

          targetChat = {
            id: resolvedId,
            name: contactName,
            avatar: initialContact.avatar || '👤',
            badge: initialContact.badge || 'Proveedor Verificado',
            zone: initialContact.zone || 'Zona A',
            topic: initialContact.topic || 'Coordinación Vecinal',
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
          list = [targetChat, ...list.filter((c) => c.name.trim().toLowerCase() !== contactName.toLowerCase())];
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
        if (active && detail && Array.isArray(detail.messages) && detail.messages.length > 0) {
          const mapped = detail.messages.map((m) => ({
            id: String(m.id),
            sender: m.is_me ? 'me' : 'them',
            text: m.text || m.content || '',
            time: m.time || 'Ahora'
          }));

          setSelectedChat((prev) => {
            if (!prev || String(prev.id) !== String(selectedChat.id)) return prev;
            return {
              ...prev,
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

    // Intervalo de actualización en tiempo real mientras el chat esté abierto
    const pollTimer = setInterval(async () => {
      if (!active || !token) return;
      try {
        const msgs = await api.getChatMessages(selectedChat.id, token);
        if (active && Array.isArray(msgs) && msgs.length > 0) {
          const mapped = msgs.map((m) => ({
            id: String(m.id),
            sender: m.is_me ? 'me' : 'them',
            text: m.text || m.content || '',
            time: m.time || 'Ahora'
          }));

          setSelectedChat((prev) => {
            if (!prev || String(prev.id) !== String(selectedChat.id)) return prev;
            const prevLen = prev.messages ? prev.messages.length : 0;
            const lastPrev =
              prev.messages && prev.messages.length > 0
                ? prev.messages[prev.messages.length - 1].text
                : '';
            const lastNew = mapped[mapped.length - 1]?.text;

            if (prevLen !== mapped.length || lastPrev !== lastNew) {
              return {
                ...prev,
                lastMessage: lastNew || prev.lastMessage,
                messages: mapped
              };
            }
            return prev;
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
              {selectedChat.badge} • {selectedChat.zone}
            </Text>
          </View>

          {/* Botón de Llamada Rápida */}
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
                      <Text style={[styles.bubbleSenderName, { fontSize: scale(10) }]}>
                        {selectedChat.name}
                      </Text>
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

          {/* Barra de Entrada de Texto estilo WhatsApp */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, { fontSize: scale(13) }]}
              placeholder={`Escribe un mensaje a ${selectedChat.name}...`}
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
        </KeyboardAvoidingView>
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
                    <View style={styles.verifiedMini}>
                      <Ionicons name="checkmark" size={8} color="#ffffff" />
                    </View>
                  </View>
                  <Text style={[styles.convTime, { fontSize: scale(10) }]}>
                    {conv.time}
                  </Text>
                </View>

                <Text style={[styles.convTopic, { fontSize: scale(10) }]}>
                  📌 {conv.topic}
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
  }
});
