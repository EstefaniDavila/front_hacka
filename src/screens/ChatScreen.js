import React, { useState, useRef } from 'react';
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

export default function ChatScreen({
  fontScale = 1.0,
  onBack,
  initialContact = null
}) {
  const scale = (val) => Math.round(val * fontScale);

  // Lista de conversaciones comunitarias
    const [conversations, setConversations] = useState(() => {
    if (!initialContact) return [];
    return [{
      id: 'chat-new-' + Date.now(),
      name: initialContact.name || 'Vecino',
      avatar: initialContact.avatar || '👤',
      badge: initialContact.badge || 'Vecino Verificado',
      zone: initialContact.zone || 'Zona A',
      topic: initialContact.topic || 'Coordinación Vecinal',
      lastMessage: 'Iniciaste una conversación.',
      time: 'Ahora',
      unread: 0,
      phone: initialContact.phone || 'Número coordinado',
      messages: [
        {
          id: 'init-1',
          sender: 'them',
          text: `Hola, conversemos sobre ${initialContact.topic || 'la coordinación comunitaria'}.`,
          time: 'Ahora'
        }
      ]
    }];
  });

  // Si se envió un contacto inicial, abrir ese chat de inmediato
  const [selectedChat, setSelectedChat] = useState(() => {
    if (!initialContact) return null;
    const existing = conversations.find(c => c.name === initialContact.name);
    if (existing) return existing;
    return {
      id: 'chat-new-' + Date.now(),
      name: initialContact.name || 'Vecino',
      avatar: initialContact.avatar || '👤',
      badge: initialContact.badge || 'Vecino Verificado',
      zone: initialContact.zone || 'Zona A',
      topic: initialContact.topic || 'Coordinación Vecinal',
      lastMessage: 'Iniciaste una conversación.',
      time: 'Ahora',
      unread: 0,
      phone: initialContact.phone || 'Número coordinado',
      messages: [
        {
          id: 'init-1',
          sender: 'them',
          text: `Hola vecina, conversemos sobre ${initialContact.topic || 'la coordinación comunitaria'}.`,
          time: 'Ahora'
        }
      ]
    };
  });

  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef(null);

  const quickReplies = [
    '¡Hola vecina! Cuenta con mi apoyo 🤝',
    '¿A qué hora te acomoda? ⏰',
    'Ya voy en camino 🚶‍♀️',
    'Muchas gracias vecino 🙏'
  ];

  const handleSendMessage = (textToSend) => {
    const content = textToSend || inputText.trim();
    if (!content || !selectedChat) return;

    const newMessage = {
      id: 'msg-' + Date.now(),
      sender: 'me',
      text: content,
      time: 'Ahora'
    };

    const updatedChat = {
      ...selectedChat,
      lastMessage: content,
      time: 'Ahora',
      messages: [...selectedChat.messages, newMessage]
    };

    setSelectedChat(updatedChat);
    setConversations(prev =>
      prev.map(c => c.id === selectedChat.id ? updatedChat : c)
    );
    setInputText('');
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
              if (initialContact && onBack) {
                onBack();
              } else {
                setSelectedChat(null);
              }
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
            onPress={() => alert(`Llamando al vecino (${selectedChat.phone})...`)}
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
            {selectedChat.messages.map((msg) => {
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

            {conv.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{conv.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyListBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginTop: 20
  },
  emptyListTitle: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8
  },
  emptyListSub: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  headerTitle: {
    fontWeight: '900',
    color: COLORS.primaryDeep
  },
  headerSub: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  listContent: {
    padding: 14,
    gap: 10,
    paddingBottom: 90
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12
  },
  convAvatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1.5,
    borderColor: COLORS.primaryPale,
    alignItems: 'center',
    justifyContent: 'center'
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  convName: {
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  verifiedMini: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  convTime: {
    color: COLORS.textMuted,
    fontWeight: '600'
  },
  convTopic: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    marginBottom: 2
  },
  convLastMessage: {
    color: COLORS.textSecondary,
    fontWeight: '500'
  },
  convLastMessageUnread: {
    color: COLORS.textPrimary,
    fontWeight: '800'
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  unreadText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900'
  },
  chatDetailContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center'
  },
  chatDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10
  },
  backButton: {
    padding: 6
  },
  chatHeaderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chatHeaderName: {
    fontWeight: '800',
    color: COLORS.textPrimary
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
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900'
  },
  chatHeaderSubtitle: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  phoneCallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryPale,
    alignItems: 'center',
    justifyContent: 'center'
  },
  topicCard: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryPale
  },
  topicCardText: {
    color: COLORS.textSecondary
  },
  topicCardSecure: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    marginTop: 2
  },
  messagesList: {
    flex: 1
  },
  messagesContent: {
    padding: 14,
    gap: 10
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 4
  },
  messageRowMe: {
    justifyContent: 'flex-end'
  },
  messageRowThem: {
    justifyContent: 'flex-start'
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14
  },
  bubbleMe: {
    backgroundColor: COLORS.primaryDark,
    borderBottomRightRadius: 2
  },
  bubbleThem: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  messageText: {
    lineHeight: 18
  },
  messageTextMe: {
    color: COLORS.white,
    fontWeight: '600'
  },
  messageTextThem: {
    color: COLORS.textPrimary,
    fontWeight: '500'
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4
  },
  messageTime: {
    fontWeight: '600'
  },
  messageTimeMe: {
    color: '#ccfbf1'
  },
  messageTimeThem: {
    color: COLORS.textMuted
  },
  checkmarks: {
    color: '#5eead4',
    fontWeight: '900'
  },
  quickRepliesContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  quickReplyPill: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  quickReplyText: {
    color: COLORS.primaryDark,
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
