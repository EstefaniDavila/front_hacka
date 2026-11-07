import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import { COLORS } from '../theme/colors';
import { mockSolidarityPosts } from '../data/mockData';

export default function SolidarityScreen({
  onNavigate,
  fontScale = 1.0,
  helpedCount = 12,
  onIncrementHelped,
  onOpenChat
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [publishModalVisible, setPublishModalVisible] = useState(false);

  // Lista local de posts con persistencia durante la sesión
  const [postsList, setPostsList] = useState(mockSolidarityPosts);

  // Formulario de publicación directa en Ayuda Solidaria
  const [newPostType, setNewPostType] = useState('Necesito ayuda'); // 'Necesito ayuda' | 'Puedo apoyar' | 'Donación' | 'Intercambio'
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostDesc, setNewPostDesc] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Apoyo temporal');
  const [newPostDate, setNewPostDate] = useState('Hoy / Próximos días');

  const scale = (val) => Math.round(val * fontScale);

  const categories = [
    { id: 'all', name: 'Todo', icon: '▦' },
    { id: 'Herramientas', name: 'Herramientas', icon: '🛠️' },
    { id: 'Apoyo temporal', name: 'Apoyo temporal', icon: '🤝' },
    { id: 'Donaciones', name: 'Donaciones', icon: '📦' },
    { id: 'Intercambio', name: 'Intercambio', icon: '🔄' }
  ];

  const filteredPosts = activeCategory === 'all'
    ? postsList
    : postsList.filter(p => p.category === activeCategory);

  const handleOpenDetail = (post) => {
    setSelectedPost(post);
    setDetailModalVisible(true);
  };

  const handleOfferHelp = () => {
    onIncrementHelped();
    setDetailModalVisible(false);
    Alert.alert(
      '🎉 ¡Muchas gracias por tu solidaridad!',
      `Se le notificó a ${selectedPost?.author_name} que estás dispuesta a brindarle apoyo con "${selectedPost?.title}". Tu contador de ayuda aumentó a ${helpedCount + 1}.`
    );
  };

  const handlePublishSolidarity = () => {
    if (!newPostTitle.trim()) {
      Alert.alert('Campo obligatorio', 'Por favor ingresa un título para la publicación.');
      return;
    }

    const iconsMap = {
      'Necesito ayuda': '💬',
      'Puedo apoyar': '🤝',
      'Donación': '📦',
      'Intercambio': '🔄'
    };

    const createdPost = {
      id: 'sol-user-' + Date.now(),
      author_id: 'u-user-01',
      author_name: 'Doña Martha Q. (Tú)',
      author_avatar: '👵',
      type: newPostType,
      category: newPostCategory,
      title: newPostTitle.trim(),
      description: newPostDesc.trim() || 'Coordinación directa con vecinos de la manzana.',
      available_until: newPostDate,
      block_code: 'Zona A – Mz. 2',
      time_ago: 'Recién publicado',
      icon: iconsMap[newPostType] || '🤝'
    };

    setPostsList([createdPost, ...postsList]);
    setPublishModalVisible(false);
    setNewPostTitle('');
    setNewPostDesc('');

    Alert.alert(
      '✅ ¡Publicado en el Muro Comunitario!',
      'Tu publicación ya es visible para todos tus vecinos de Zona A, Manzana 2.'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* Cabecera en VERDE AZULADO (Teal) unificada con el resto de la app */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconCircle}>
              <Text style={{ fontSize: 22 }}>🤝</Text>
            </View>
            <View>
              <Text style={[styles.headerTitle, { fontSize: scale(17) }]}>
                Ayuda Solidaria
              </Text>
              <Text style={[styles.headerSub, { fontSize: scale(11) }]}>
                Muro Comunitario & Cadena de Favores
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 24 }}>❤️</Text>
        </View>

        {/* SUB-TABS INTERACTIVOS: MURO DE AYUDA Y ECONOMÍA SOLIDARIA */}
        <View style={styles.subtabsContainer}>
          <TouchableOpacity
            style={[styles.subtabButton, styles.subtabActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.subtabText, styles.subtabTextActive, { fontSize: scale(11) }]}>
              📋 Muro de Ayuda
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subtabButton, styles.subtabInactive]}
            activeOpacity={0.8}
            onPress={() => onNavigate('eco_solidaria')}
          >
            <Text style={[styles.subtabText, styles.subtabTextInactive, { fontSize: scale(11) }]}>
              🚨 Economía Solidaria
            </Text>
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>Urgente</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.communityQuote, { fontSize: scale(11) }]}>
          "Vecinos que se apoyan sin costo, con confianza y solidaridad mutua."
        </Text>

        {/* Balance Solidario en Verde Azulado: Veces ayudado / Veces recibido */}
        <View style={styles.balanceGrid}>
          <View style={styles.balanceBox}>
            <Text style={[styles.balanceLabel, { fontSize: scale(10) }]}>
              Veces que has ayudado
            </Text>
            <Text style={[styles.balanceNumberHelped, { fontSize: scale(22) }]}>
              {helpedCount}
            </Text>
            <Text style={[styles.balanceSub, { fontSize: scale(9) }]}>
              solidaridad activa
            </Text>
          </View>

          <View style={styles.balanceBox}>
            <Text style={[styles.balanceLabel, { fontSize: scale(10) }]}>
              Veces que has recibido ayuda
            </Text>
            <Text style={[styles.balanceNumberReceived, { fontSize: scale(22) }]}>
              4
            </Text>
            <Text style={[styles.balanceSub, { fontSize: scale(9) }]}>
              apoyo de vecinos
            </Text>
          </View>
        </View>
      </View>

      {/* Categorías de Ayuda Solidaria (Horizontal) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text style={{ fontSize: 13, marginRight: 4 }}>{cat.icon}</Text>
              <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive, { fontSize: scale(11) }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tarjeta de Publicar "¿En qué puedes ayudar?" -> Abre directo publicación en Ayuda Solidaria */}
      <View style={styles.publishCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text style={{ fontSize: 24, marginRight: 10 }}>✨</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.publishCardTitle, { fontSize: scale(13) }]}>
              ¿En qué puedes ayudar?
            </Text>
            <Text style={[styles.publishCardSub, { fontSize: scale(10) }]}>
              Publica una necesidad o una oferta comunitaria en solo 3 pasos.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.publishBtn}
          activeOpacity={0.85}
          onPress={() => setPublishModalVisible(true)}
        >
          <Text style={[styles.publishBtnText, { fontSize: scale(12) }]}>+ Publicar</Text>
        </TouchableOpacity>
      </View>

      {/* Título de la sección con selector de manzana */}
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { fontSize: scale(13) }]}>
          PUBLICACIONES DE TU COMUNIDAD
        </Text>
        <View style={styles.blockTagWrap}>
          <Text style={[styles.blockTag, { fontSize: scale(10) }]}>
            📍 Zona A – Mz. 2
          </Text>
        </View>
      </View>

      {/* Listado de Publicaciones del Muro */}
      {filteredPosts.map((post) => (
        <TouchableOpacity
          key={post.id}
          style={styles.postCard}
          activeOpacity={0.85}
          onPress={() => handleOpenDetail(post)}
        >
          <View style={styles.postHeader}>
            <View style={styles.tagWrap}>
              <Text style={[styles.postTag, { fontSize: scale(10) }]}>
                {post.icon} {post.category || post.type}
              </Text>
            </View>
            <Text style={[styles.postTime, { fontSize: scale(10) }]}>
              {post.time_ago}
            </Text>
          </View>

          <Text style={[styles.postTitle, { fontSize: scale(14) }]}>
            {post.title}
          </Text>
          <Text style={[styles.postDesc, { fontSize: scale(11) }]} numberOfLines={2}>
            {post.description}
          </Text>

          <View style={styles.postFooter}>
            <View style={styles.authorRow}>
              <Text style={{ fontSize: 16, marginRight: 6 }}>{post.author_avatar || '👤'}</Text>
              <Text style={[styles.authorName, { fontSize: scale(11) }]}>
                {post.author_name} • {post.block_code}
              </Text>
            </View>
            
            <View style={styles.wantHelpBtn}>
              <Text style={[styles.wantHelpBtnText, { fontSize: scale(11) }]}>
                🤝 Quiero ayudar
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      {/* MODAL 1: DETALLE DE PUBLICACIÓN CON BOTÓN DE ENVIAR MENSAJE / CHAT */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: scale(16) }]}>
                Detalle de Publicación
              </Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Text style={{ fontSize: 22, color: COLORS.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedPost && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.tagWrapDetail}>
                  <Text style={[styles.postTagDetail, { fontSize: scale(11) }]}>
                    💬 {selectedPost.type || 'Necesito ayuda'}
                  </Text>
                </View>

                <Text style={[styles.modalPostTitle, { fontSize: scale(18) }]}>
                  {selectedPost.title}
                </Text>

                <View style={styles.modalAuthorBox}>
                  <Text style={{ fontSize: 36, marginRight: 10 }}>{selectedPost.author_avatar || '👵'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalAuthorName, { fontSize: scale(14) }]}>
                      {selectedPost.author_name}
                    </Text>
                    <Text style={[styles.modalVerified, { fontSize: scale(10) }]}>
                      ✓ Vecina verificada • {selectedPost.time_ago}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.modalPostDesc, { fontSize: scale(13) }]}>
                  "{selectedPost.description}"
                </Text>
                
                <View style={styles.detailLocationBox}>
                  <Text style={[styles.detailLocItem, { fontSize: scale(11) }]}>
                    📍 {selectedPost.block_code}
                  </Text>
                  <Text style={[styles.detailLocItem, { fontSize: scale(11) }]}>
                    📅 Disponibilidad: {selectedPost.available_until || 'Sábado por la mañana'}
                  </Text>
                </View>

                {/* Vecinos interesados */}
                <View style={styles.interestedNeighborsCard}>
                  <Text style={[styles.interestedTitle, { fontSize: scale(11) }]}>
                    🤝 Vecinos interesados (2 disponibles)
                  </Text>
                  <View style={styles.neighborPill}>
                    <Text style={{ fontSize: 16, marginRight: 6 }}>👨</Text>
                    <Text style={[styles.neighborPillName, { fontSize: scale(11) }]}>Luis G.</Text>
                    <View style={styles.availableTag}><Text style={styles.availableTagText}>Disponible</Text></View>
                  </View>
                  <View style={styles.neighborPill}>
                    <Text style={{ fontSize: 16, marginRight: 6 }}>👩</Text>
                    <Text style={[styles.neighborPillName, { fontSize: scale(11) }]}>María C.</Text>
                    <View style={styles.availableTag}><Text style={styles.availableTagText}>Disponible</Text></View>
                  </View>
                </View>

                {/* Botón: Quiero Ayudar */}
                <TouchableOpacity
                  style={styles.modalActionButton}
                  activeOpacity={0.8}
                  onPress={handleOfferHelp}
                >
                  <Text style={[styles.modalActionText, { fontSize: scale(14) }]}>
                    🤝 Quiero ayudar
                  </Text>
                </TouchableOpacity>

                {/* Botón: Enviar Mensaje (Abre la pantalla de chat directo) */}
                <TouchableOpacity
                  style={styles.modalChatButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    setDetailModalVisible(false);
                    if (onOpenChat) {
                      onOpenChat({
                        name: selectedPost.author_name,
                        topic: selectedPost.title,
                        avatar: selectedPost.author_avatar || '👵',
                        zone: selectedPost.block_code,
                        badge: 'Vecina verificada'
                      });
                    } else {
                      onNavigate('chat');
                    }
                  }}
                >
                  <Text style={[styles.modalChatButtonText, { fontSize: scale(14) }]}>
                    💬 Enviar mensaje al vecino
                  </Text>
                </TouchableOpacity>

                <View style={styles.secureNotice}>
                  <Text style={{ fontSize: 14, marginRight: 6 }}>🔒</Text>
                  <Text style={[styles.secureNoticeText, { fontSize: scale(10) }]}>
                    Colaboración segura: Tu información se comparte solo cuando ambos aceptan la ayuda.
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 2: PUBLICAR DIRECTO EN AYUDA SOLIDARIA (PANTALLA DE PUBLICAR SOLICITADA) */}
      <Modal visible={publishModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.publishModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 22 }}>✍️</Text>
                <Text style={[styles.modalTitle, { fontSize: scale(16) }]}>
                  Publicar en Ayuda Solidaria
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPublishModalVisible(false)}>
                <Text style={{ fontSize: 22, color: COLORS.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520, padding: 16 }}>
              {/* Selector de Tipo de Publicación */}
              <Text style={[styles.formLabel, { fontSize: scale(12) }]}>
                1. ¿Qué tipo de publicación deseas realizar?
              </Text>
              <View style={styles.typeSelectorGrid}>
                {[
                  { id: 'Necesito ayuda', label: '💬 Necesito ayuda', desc: 'Pedir apoyo vecinal' },
                  { id: 'Puedo apoyar', label: '🤝 Puedo apoyar', desc: 'Ofrecer mi tiempo' },
                  { id: 'Donación', label: '📦 Donación', desc: 'Víveres o enseres' },
                  { id: 'Intercambio', label: '🔄 Intercambio', desc: 'Trueque solidario' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.typeOptionCard,
                      newPostType === item.id && styles.typeOptionCardSelected
                    ]}
                    onPress={() => setNewPostType(item.id)}
                  >
                    <Text style={[styles.typeOptionLabel, newPostType === item.id && styles.typeOptionLabelSelected, { fontSize: scale(12) }]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.typeOptionDesc, { fontSize: scale(9) }]}>
                      {item.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Título */}
              <Text style={[styles.formLabel, { fontSize: scale(12), marginTop: 12 }]}>
                2. Título de la publicación *
              </Text>
              <TextInput
                style={[styles.formInput, { fontSize: scale(13) }]}
                placeholder="Ej. Apoyo para mudanza este fin de semana"
                value={newPostTitle}
                onChangeText={setNewPostTitle}
              />

              {/* Categoría */}
              <Text style={[styles.formLabel, { fontSize: scale(12), marginTop: 10 }]}>
                3. Categoría comunitaria
              </Text>
              <View style={styles.catChipsRow}>
                {['Herramientas', 'Apoyo temporal', 'Donaciones', 'Intercambio', 'Salud/Cuidados'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, newPostCategory === cat && styles.catChipSelected]}
                    onPress={() => setNewPostCategory(cat)}
                  >
                    <Text style={[styles.catChipText, newPostCategory === cat && styles.catChipTextSelected, { fontSize: scale(10) }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Descripción */}
              <Text style={[styles.formLabel, { fontSize: scale(12), marginTop: 10 }]}>
                4. Detalles de la ayuda o necesidad (Opcional)
              </Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea, { fontSize: scale(12) }]}
                multiline
                numberOfLines={3}
                placeholder="Explica a tus vecinos cómo pueden colaborar, horarios y referencias..."
                value={newPostDesc}
                onChangeText={setNewPostDesc}
              />

              {/* Ubicación y Manzana */}
              <View style={styles.formLocationNotice}>
                <Text style={{ fontSize: 16, marginRight: 6 }}>📍</Text>
                <Text style={[styles.formLocationText, { fontSize: scale(10) }]}>
                  Se publicará para vecinos de: <Text style={{ fontWeight: '800' }}>Zona A, Manzana 2</Text>
                </Text>
              </View>

              {/* Botón de Publicar */}
              <TouchableOpacity
                style={styles.submitSolidarityButton}
                activeOpacity={0.8}
                onPress={handlePublishSolidarity}
              >
                <Text style={[styles.submitSolidarityText, { fontSize: scale(14) }]}>
                  🚀 PUBLICAR EN EL MURO SOLIDARIO
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    padding: 16,
    paddingBottom: 90,
    gap: 12
  },
  headerCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  headerTitle: {
    fontWeight: '900',
    color: COLORS.white
  },
  headerSub: {
    color: '#ccfbf1',
    fontWeight: '600'
  },
  subtabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12
  },
  subtabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  subtabActive: {
    backgroundColor: COLORS.white
  },
  subtabInactive: {
    backgroundColor: 'transparent'
  },
  subtabText: {
    fontWeight: '800'
  },
  subtabTextActive: {
    color: COLORS.primaryDark
  },
  subtabTextInactive: {
    color: '#e6fffa'
  },
  urgentBadge: {
    backgroundColor: COLORS.emergency,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6
  },
  urgentBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900'
  },
  communityQuote: {
    color: '#f0fdfa',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12
  },
  balanceGrid: {
    flexDirection: 'row',
    gap: 10
  },
  balanceBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  balanceLabel: {
    color: '#ccfbf1',
    fontWeight: '700',
    textAlign: 'center'
  },
  balanceNumberHelped: {
    fontWeight: '900',
    color: '#fef08a', // Amarillo cálido para resaltar
    marginVertical: 2
  },
  balanceNumberReceived: {
    fontWeight: '900',
    color: COLORS.white,
    marginVertical: 2
  },
  balanceSub: {
    color: '#ccfbf1',
    fontWeight: '600'
  },
  categoriesScroll: {
    flexGrow: 0
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  categoryPillActive: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary,
    borderWidth: 1.5
  },
  categoryPillText: {
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  categoryPillTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '800'
  },
  publishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySurface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  publishCardTitle: {
    fontWeight: '900',
    color: COLORS.primaryDeep
  },
  publishCardSub: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  publishBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12
  },
  publishBtnText: {
    color: COLORS.white,
    fontWeight: '900'
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  sectionTitle: {
    fontWeight: '900',
    color: COLORS.textPrimary
  },
  blockTagWrap: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  blockTag: {
    color: COLORS.primaryDark,
    fontWeight: '700'
  },
  postCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  tagWrap: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  postTag: {
    color: COLORS.primaryDeep,
    fontWeight: '800'
  },
  postTime: {
    color: COLORS.textMuted,
    fontWeight: '600'
  },
  postTitle: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  postDesc: {
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 10
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  authorName: {
    color: COLORS.textSecondary,
    fontWeight: '700'
  },
  wantHelpBtn: {
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  wantHelpBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '800'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%'
  },
  publishModalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  modalTitle: {
    fontWeight: '900',
    color: COLORS.textPrimary
  },
  modalBody: {
    paddingVertical: 14
  },
  tagWrapDetail: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8
  },
  postTagDetail: {
    color: COLORS.primaryDeep,
    fontWeight: '800'
  },
  modalPostTitle: {
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 10
  },
  modalAuthorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 12,
    marginBottom: 10
  },
  modalAuthorName: {
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  modalVerified: {
    color: COLORS.primaryDark,
    fontWeight: '700'
  },
  modalPostDesc: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 12
  },
  detailLocationBox: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: 10,
    padding: 10,
    gap: 4,
    marginBottom: 12
  },
  detailLocItem: {
    color: COLORS.textPrimary,
    fontWeight: '700'
  },
  interestedNeighborsCard: {
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 12,
    gap: 6,
    marginBottom: 14
  },
  interestedTitle: {
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  neighborPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 8
  },
  neighborPillName: {
    flex: 1,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  availableTag: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  availableTagText: {
    color: '#059669',
    fontWeight: '800',
    fontSize: 9
  },
  modalActionButton: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8
  },
  modalActionText: {
    color: COLORS.white,
    fontWeight: '900'
  },
  modalChatButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10
  },
  modalChatButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '900'
  },
  secureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySurface,
    padding: 10,
    borderRadius: 10
  },
  secureNoticeText: {
    color: COLORS.primaryDeep,
    fontWeight: '700',
    flex: 1
  },
  formLabel: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6
  },
  typeSelectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  typeOptionCard: {
    width: '48%',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  typeOptionCardSelected: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary,
    borderWidth: 1.5
  },
  typeOptionLabel: {
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  typeOptionLabelSelected: {
    color: COLORS.primaryDeep
  },
  typeOptionDesc: {
    color: COLORS.textSecondary,
    marginTop: 2
  },
  formInput: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    fontWeight: '600'
  },
  formTextArea: {
    minHeight: 64,
    textAlignVertical: 'top'
  },
  catChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  catChip: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  catChipSelected: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary,
    borderWidth: 1.5
  },
  catChipText: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  catChipTextSelected: {
    color: COLORS.primaryDeep,
    fontWeight: '800'
  },
  formLocationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySurface,
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 14
  },
  formLocationText: {
    color: COLORS.primaryDeep
  },
  submitSolidarityButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20
  },
  submitSolidarityText: {
    color: COLORS.white,
    fontWeight: '900'
  }
});
