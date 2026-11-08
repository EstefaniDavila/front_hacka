import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { COLORS } from '../theme/colors';
import { customStorage } from '../services/supabase';
import { api } from '../services/api';

const CHATS_STORAGE_KEY = 'vecired_conversations_v2';

export default function ChatScreen({
  fontScale = 1.0,
  onBack,
  initialContact = null,
  onClearInitialContact = null
}) {
  const scale = (val) => Math.round(val * fontScale);

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const scrollViewRef = useRef(null);

  const quickReplies = [
    '¡Hola vecina! Cuenta con mi apoyo 🤝',
    '¿A qué hora te acomoda? ⏰',
    'Ya voy en camino 🚶‍♀️',
    'Muchas gracias vecino 🙏'
  ];

  // 1. Cargar conversaciones guardadas permanentemente en storage
  useEffect(() => {
    let mounted = true;

    async function initChats() {
      let list = [];
      try {
        const raw = await customStorage.getItem(CHATS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            list = parsed;
          }
        }
      } catch (e) {
        console.warn('[ChatScreen] Error leyendo storage de chats:', e);
      }

      // 2. Si se abrió para contactar a un vecino específico (desde Servicios o Muro)
      if (initialContact && initialContact.name) {
        const contactName = initialContact.name.trim();
        let targetChat = list.find((c) => c.name && c.name.trim() === contactName);

        if (!targetChat) {
          targetChat = {
            id: 'chat-' + (initialContact.id || Date.now()),
            name: contactName,
            avatar: initialContact.avatar || '👤',
            badge: initialContact.badge || 'Proveedor Verificado',
            zone: initialContact.zone || 'Zona A',
            topic: initialContact.topic || 'Coordinación de Servicio',
            lastMessage: 'Iniciaste una conversación.',
            time: 'Ahora',
            unread: 0,
            phone: initialContact.phone || '987654321',
            messages: [
              {
                id: 'msg-init-' + Date.now(),
                sender: 'them',
                text: `¡Hola vecina! Gracias por contactarme sobre ${initialContact.topic || 'el servicio'}. ¿En qué te puedo apoyar?`,
                time: 'Ahora'
              }
            ]
          };
          list = [targetChat, ...list.filter((c) => c.name !== contactName)];
          await customStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(list));
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
    };
  }, [initialContact]);

  // 3. Enviar mensaje y persistir en storage
  const handleSendMessage = async (textToSend) => {
    const content = textToSend || inputText.trim();
    if (!content || !selectedChat) return;

    const newMessage = {
      id: 'msg-' + Date.now(),
      sender: 'me',
      text: content,
      time: 'Ahora'
    };

    const updatedMessages = [...(selectedChat.messages || []), newMessage];
    const updatedChat = {
      ...selectedChat,
      lastMessage: content,
      time: 'Ahora',
      messages: updatedMessages
    };

    setSelectedChat(updatedChat);

    const updatedConversations = conversations.map((c) =>
      c.id === selectedChat.id ? updatedChat : c
    );

    if (!updatedConversations.some((c) => c.id === selectedChat.id)) {
      updatedConversations.unshift(updatedChat);
    }

    setConversations(updatedConversations);
    setInputText('');

    // Guardar en Storage para que persista al salir y volver
    try {
      await customStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updatedConversations));
    } catch (e) {
      console.warn('[ChatScreen] Error guardando mensaje en storage:', e);
    }

    // Opcional: sincronizar en backend
    try {
      await api.sendChatMessage(selectedChat.id, content);
    } catch {
      // Ignorar si el backend está en desarrollo
    }
  };

  // VISTA 1: DETALLE DE CONVERSACIÓN (CHAT ABIERTO)
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
            <Text style={{ fontSize: 20, color: COLORS.primaryDark }}>←</Text>
          </TouchableOpacity>

          <View style={styles.chatHeaderAvatar}>
            <Text style={{ fontSize: 24 }}>{selectedChat.avatar}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.chatHeaderName, { fontSize: scale(14) }]}>
                {selectedChat.name}
              </Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>✓</Text>
              </View>
            </View>
            <Text style={[styles.chatHeaderSubtitle, { fontSize: scale(10) }]}>
              {selectedChat.badge} • {selectedChat.zone}
            </Text>
          </View>

          {/* Botón de Llamada Rápida */}
          <TouchableOpacity
            style={styles.phoneCallBtn}
            onPress={() => alert(`Llamando al vecino (${selectedChat.phone || 'coordinado'})...`)}
          >
            <Text style={{ fontSize: 16 }}>📞</Text>
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
            <Text style={[styles.topicCardText, { fontSize: scale(11) }]}>
              📌 Tema: <Text style={{ fontWeight: '900', color: COLORS.primaryDeep }}>{selectedChat.topic}</Text>
            </Text>
            <Text style={[styles.topicCardSecure, { fontSize: scale(9) }]}>
              🔒 Chat vecinal seguro: Los números se protegen contra spam.
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
                  <View
                    style={[
                      styles.messageBubble,
                      isMe ? styles.bubbleMe : styles.bubbleThem
                    ]}
                  >
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, gap: 6 }}>
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
              placeholder="Escribe un mensaje al vecino..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && { opacity: 0.6 }]}
              disabled={!inputText.trim()}
              onPress={() => handleSendMessage()}
            >
              <Text style={styles.sendButtonText}>➤</Text>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <TouchableOpacity onPress={onBack}>
              <Text style={{ fontSize: 20, color: COLORS.primaryDark }}>←</Text>
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
                <Text style={{ fontSize: 26 }}>{conv.avatar}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.convTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.convName, { fontSize: scale(13) }]}>
                      {conv.name}
                    </Text>
                    <View style={styles.verifiedMini}>
                      <Text style={{ fontSize: 8, color: COLORS.white }}>✓</Text>
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

              <Text style={styles.convChevron}>›</Text>
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
  convChevron: {
    fontSize: 20,
    color: '#cbd5e1',
    marginLeft: 8
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
  verifiedBadgeText: {
    fontSize: 9,
    color: COLORS.white,
    fontWeight: '900'
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
    marginBottom: 12
  },
  messageRowMe: {
    justifyContent: 'flex-end'
  },
  messageRowThem: {
    justifyContent: 'flex-start'
  },
  messageBubble: {
    maxWidth: '82%',
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
    paddingBottom: 20
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900'
  }
});
