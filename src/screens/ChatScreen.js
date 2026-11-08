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

const CHATS_STORAGE_KEY = 'vecired_conversations_v3';

export default function ChatScreen({
  fontScale = 1.0,
  onBack,
  initialContact = null,
  onClearInitialContact = null,
  userProfile = null
}) {
  const scale = (val) => Math.round(val * fontScale);

  const currentUserName = (userProfile?.name || 'Andy Manchego').trim();

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const scrollViewRef = useRef(null);
  const typingTimerRef = useRef(null);

  const quickReplies = [
    '¡Hola vecino! Cuenta con mi apoyo 🤝',
    '¿A qué hora te acomoda? ⏰',
    'Ya voy en camino 🚶‍♀️',
    'Muchas gracias vecino 🙏'
  ];

  // Semillas por defecto con vecinos reales de la comunidad (Matías Aponte y Rosa Flores)
  const getDefaultSeedConversations = () => [
    {
      id: 'chat-matias-aponte',
      name: 'Matías Aponte',
      avatar: '👷',
      badge: 'Proveedor Verificado',
      zone: 'Zona A • Mz 2',
      topic: 'Albañilería y Pintura',
      lastMessage: '¡Listo vecino! Mañana a las 9:00 AM paso por tu casa a revisar el trabajo 🛠️',
      time: '10:45 AM',
      unread: 1,
      phone: '987654321',
      messages: [
        {
          id: 'msg-seed-1',
          sender: 'me',
          text: '¡Hola Matías! Vi tu servicio de albañilería y pintura en VeciRed. ¿Tienes disponibilidad para una reparación en mi sala?',
          time: '10:30 AM'
        },
        {
          id: 'msg-seed-2',
          sender: 'them',
          text: '¡Hola Andy! Sí, claro que sí. ¿En qué parte de la Mz 2 te encuentras y qué reparación necesitas exactamente?',
          time: '10:35 AM'
        },
        {
          id: 'msg-seed-3',
          sender: 'me',
          text: 'Estoy en el Lote 4. Es un resane de humedad pequeño y una mano de pintura blanca.',
          time: '10:40 AM'
        },
        {
          id: 'msg-seed-4',
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
      topic: 'Reparación de computadoras',
      lastMessage: 'Hola Andy, ¿puedes revisar mi laptop más tarde por favor?',
      time: 'Ayer',
      unread: 0,
      phone: '984512309',
      messages: [
        {
          id: 'msg-seed-r1',
          sender: 'them',
          text: 'Hola vecino Andy, buenas tardes. Vi tu publicación sobre reparación de computadoras en VeciRed.',
          time: 'Ayer'
        },
        {
          id: 'msg-seed-r2',
          sender: 'them',
          text: '¿Haces mantenimiento a laptops lentas? La mía se calienta un poco cuando trabajo.',
          time: 'Ayer'
        }
      ]
    }
  ];

  // 1. Cargar y sanear conversaciones del storage
  useEffect(() => {
    let mounted = true;

    async function initChats() {
      let list = [];
      try {
        const raw = await customStorage.getItem(CHATS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Filtrar cualquier conversación donde el interlocutor sea el mismo usuario actual
            list = parsed.filter(
              (c) => c && c.name && c.name.trim().toLowerCase() !== currentUserName.toLowerCase()
            );
          }
        }
      } catch (e) {
        console.warn('[ChatScreen] Error leyendo storage de chats:', e);
      }

      // Si no hay conversaciones guardadas o quedaron vacías tras filtrar auto-chats, sembrar vecinos
      if (list.length === 0) {
        list = getDefaultSeedConversations();
        try {
          await customStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(list));
        } catch {}
      }

      // 2. Si se solicitó abrir chat con un contacto específico (desde Servicios, Perfil o Muro)
      if (initialContact && initialContact.name) {
        const contactName = initialContact.name.trim();

        // Evitar que el usuario se contacte a sí mismo
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
          (c) => c.name && c.name.trim().toLowerCase() === contactName.toLowerCase()
        );

        if (!targetChat) {
          targetChat = {
            id: 'chat-' + (initialContact.id || Date.now()),
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
          try {
            await customStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(list));
          } catch {}
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
    }

    initChats();

    return () => {
      mounted = false;
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [initialContact, currentUserName]);

  // Generador inteligente de respuestas del vecino según contexto del mensaje
  const generateNeighborResponse = (userText, neighborName) => {
    const lower = userText.toLowerCase();

    if (
      lower.includes('hora') ||
      lower.includes('cuando') ||
      lower.includes('cuándo') ||
      lower.includes('acomoda') ||
      lower.includes('tiempo') ||
      lower.includes('hoy') ||
      lower.includes('mañana') ||
      lower.includes('tarde')
    ) {
      return `¡Hola vecino! Me acomoda hoy a partir de las 4:30 PM o mañana por la mañana a las 9:00 AM. ¿A qué hora te viene mejor para pasar? ⏰`;
    }

    if (
      lower.includes('precio') ||
      lower.includes('cuánto') ||
      lower.includes('cuanto') ||
      lower.includes('costo') ||
      lower.includes('cobras') ||
      lower.includes('soles') ||
      lower.includes('s/')
    ) {
      return `El precio es el indicado en la publicación vecinal. Incluye la revisión y la garantía comunitaria de confianza 🤝`;
    }

    if (
      lower.includes('camino') ||
      lower.includes('voy') ||
      lower.includes('llegando') ||
      lower.includes('dirección') ||
      lower.includes('direccion') ||
      lower.includes('donde') ||
      lower.includes('dónde') ||
      lower.includes('ubicación')
    ) {
      return `¡Excelente! Te espero en la Mz 2. Cualquier detalle me timbras directamente con el botón de llamada 📞`;
    }

    if (
      lower.includes('gracias') ||
      lower.includes('apoyo') ||
      lower.includes('amable') ||
      lower.includes('buena onda') ||
      lower.includes('cuenta con')
    ) {
      return `¡No te preocupes vecino, para eso estamos en VeciRed! Un gusto darnos una mano siempre 🙌`;
    }

    if (
      lower.includes('laptop') ||
      lower.includes('computadora') ||
      lower.includes('pc') ||
      lower.includes('reparar') ||
      lower.includes('pantalla') ||
      lower.includes('disco')
    ) {
      return `¡Perfecto! Pásame tu manzana o lote exacto para coordinar la revisión del equipo 💻`;
    }

    return `¡Entendido! Con gusto te apoyo con eso. ¿En qué dirección o manzana exacta te encuentras para acercarme?`;
  };

  // 3. Enviar mensaje del usuario y simular respuesta bidireccional interactiva del vecino
  const handleSendMessage = async (textToSend) => {
    const content = textToSend || inputText.trim();
    if (!content || !selectedChat) return;

    const myMessage = {
      id: 'msg-' + Date.now(),
      sender: 'me',
      text: content,
      time: 'Ahora'
    };

    const currentChat = selectedChat;
    const updatedMessages = [...(currentChat.messages || []), myMessage];
    const chatAfterMyMsg = {
      ...currentChat,
      lastMessage: content,
      time: 'Ahora',
      messages: updatedMessages
    };

    setSelectedChat(chatAfterMyMsg);

    const updatedConversations = conversations.map((c) =>
      c.id === currentChat.id ? chatAfterMyMsg : c
    );
    if (!updatedConversations.some((c) => c.id === currentChat.id)) {
      updatedConversations.unshift(chatAfterMyMsg);
    }

    setConversations(updatedConversations);
    setInputText('');

    // Persistir mensaje enviado
    try {
      await customStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updatedConversations));
    } catch (e) {
      console.warn('[ChatScreen] Error guardando mensaje:', e);
    }

    // Scroll inmediato
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 60);

    // Activar indicador de que el vecino está escribiendo
    setIsTyping(true);

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    // El vecino responde interactivamente tras 1.2 segundos (bidireccional)
    typingTimerRef.current = setTimeout(async () => {
      const neighborReply = generateNeighborResponse(content, currentChat.name);

      const themMessage = {
        id: 'msg-rep-' + Date.now(),
        sender: 'them',
        text: neighborReply,
        time: 'Ahora'
      };

      setSelectedChat((prevChat) => {
        if (!prevChat || prevChat.id !== currentChat.id) return prevChat;
        const withReply = {
          ...prevChat,
          lastMessage: neighborReply,
          time: 'Ahora',
          messages: [...(prevChat.messages || []), themMessage]
        };

        setConversations((prevList) => {
          const listWithReply = prevList.map((c) => (c.id === currentChat.id ? withReply : c));
          customStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(listWithReply)).catch(() => {});
          return listWithReply;
        });

        return withReply;
      });

      setIsTyping(false);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }, 1250);

    // Opcional: sincronizar en backend
    try {
      await api.sendChatMessage(currentChat.id, content);
    } catch {}
  };

  // Restablecer / limpiar historial de chats si el usuario lo desea
  const handleResetChats = () => {
    Alert.alert(
      '¿Restablecer mensajes?',
      'Se reiniciarán tus conversaciones comunitarias con los vecinos de confianza del barrio.',
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
              await customStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(seeds));
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
                `¿Deseas llamar a ${selectedChat.name} al ${selectedChat.phone || '987-654-321'} para coordinar?`,
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

            {/* Indicador interactivo de que el vecino está escribiendo */}
            {isTyping && (
              <View style={[styles.messageRow, styles.messageRowThem]}>
                <View style={styles.bubbleSenderAvatar}>
                  <Text style={{ fontSize: 16 }}>{selectedChat.avatar || '👤'}</Text>
                </View>
                <View style={styles.bubbleThemTyping}>
                  <Text style={[styles.typingText, { fontSize: scale(11) }]}>
                    ✍️ {selectedChat.name} está escribiendo...
                  </Text>
                </View>
              </View>
            )}
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

          {/* Barra de Entrada de Texto con botón Enviar visible */}
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
              style={[styles.sendButton, !inputText.trim() && { opacity: 0.6 }]}
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

          {/* Botón para reiniciar/limpiar chats a los vecinos de ejemplo */}
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
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  resetHeaderBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '700'
  },
  listContent: {
    padding: 16,
    paddingBottom: 40
  },
  emptyListBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginTop: 24
  },
  emptyListTitle: {
    fontWeight: '800',
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
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
    color: '#0f172a'
  },
  verifiedMini: {
    backgroundColor: COLORS.primary,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  convTime: {
    color: COLORS.textMuted,
    fontWeight: '500'
  },
  convTopic: {
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: 2
  },
  convLastMessage: {
    color: COLORS.textMuted,
    fontWeight: '500'
  },
  convLastMessageUnread: {
    color: '#0f172a',
    fontWeight: '700'
  },
  chatDetailContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  chatDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12
  },
  backButton: {
    padding: 4
  },
  chatHeaderAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  chatHeaderName: {
    fontWeight: '800',
    color: '#0f172a'
  },
  verifiedBadge: {
    backgroundColor: COLORS.primary,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chatHeaderSubtitle: {
    color: COLORS.textMuted,
    fontWeight: '500'
  },
  phoneCallBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  topicCard: {
    backgroundColor: '#f0fdfa',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccfbf1'
  },
  topicCardText: {
    color: '#0d9488',
    marginBottom: 2
  },
  topicCardSecure: {
    color: '#14b8a6',
    fontWeight: '500'
  },
  messagesList: {
    flex: 1
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end'
  },
  messageRowMe: {
    justifyContent: 'flex-end'
  },
  messageRowThem: {
    justifyContent: 'flex-start'
  },
  bubbleSenderAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
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
    color: COLORS.primaryDark,
    marginBottom: 3
  },
  bubbleThemTyping: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderBottomLeftRadius: 4
  },
  typingText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic'
  },
  messageText: {
    lineHeight: 19,
    fontWeight: '500'
  },
  messageTextMe: {
    color: COLORS.white
  },
  messageTextThem: {
    color: '#0f172a'
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4
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
    color: '#ccfbf1',
    fontWeight: '900'
  },
  quickRepliesContainer: {
    paddingVertical: 6,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  quickReplyPill: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  quickReplyText: {
    color: '#334155',
    fontWeight: '700'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    color: '#0f172a',
    fontWeight: '600'
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
