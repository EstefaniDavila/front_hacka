import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Image
} from 'react-native';
import { COLORS } from '../theme/colors';
import { mockSolidarityPosts } from '../data/mockData';

export default function SolidarityScreen({
  onNavigate,
  fontScale = 1.0,
  helpedCount = 0,
  onIncrementHelped,
  onOpenChat
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [publishModalVisible, setPublishModalVisible] = useState(false);

  // Lista local de posts con persistencia durante la sesión
  const [postsList, setPostsList] = useState([]);

  useEffect(() => {
    loadPosts();
  }, [activeCategory]);

  const loadPosts = async () => {
    try {
      const data = await api.getSolidarityPosts({ category: activeCategory });
      setPostsList(data || []);
    } catch {
      setPostsList([]);
    }
  };

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

  const handlePublishSolidarity = async () => {
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
      author_name: 'Tú (Vecino)',
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

    const serverPost = await api.createSolidarityPost({
      title: newPostTitle.trim(),
      desc: newPostDesc.trim(),
      category: newPostCategory,
      type: newPostType
    });
    setPostsList(prev => [serverPost || createdPost, ...prev]);
    setPublishModalVisible(false);
    setNewPostTitle('');
    setNewPostDesc('');

    Alert.alert(
      '✅ ¡Publicado en el Muro Comunitario!',
      'Tu publicación ya es visible para todos tus vecinos de Zona A, Manzana 2.'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>

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
              0
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
          onPress={() => onNavigate('publish', { type: 'necesito_ayuda' })}
        >
          <Ionicons name="add" size={14} color="#ffffff" style={{ marginRight: 2 }} />
          <Text style={[styles.publishBtnText, { fontSize: scale(12) }]}>Publicar</Text>
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
      {filteredPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 44, marginBottom: 10 }}>🤝</Text>
          <Text style={[styles.emptyTitle, { fontSize: scale(15) }]}>
            Aún no hay publicaciones en el muro
          </Text>
          <Text style={[styles.emptySub, { fontSize: scale(11) }]}>
            Sé el primero en compartir un favor, préstamo de herramientas o apoyo vecinal.
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => onNavigate('publish', { type: 'necesito_ayuda' })}
          >
            <Ionicons name="add" size={14} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.emptyActionBtnText}>Crear primera publicación</Text>
          </TouchableOpacity>
        </View>
      ) : (
        filteredPosts.map((post) => (
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
              {post.author_avatar && post.author_avatar.startsWith('http') ? (
                <Image source={{ uri: post.author_avatar }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 6 }} />
              ) : (
                <Text style={{ fontSize: 16, marginRight: 6 }}>{post.author_avatar || '👤'}</Text>
              )}
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
      )))}

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
                  {selectedPost.author_avatar && selectedPost.author_avatar.startsWith('http') ? (
                    <Image source={{ uri: selectedPost.author_avatar }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 10 }} />
                  ) : (
                    <Text style={{ fontSize: 36, marginRight: 10 }}>{selectedPost.author_avatar || '👵'}</Text>
                  )}
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
                  <Text style={{ fontSize: 16, marginRight: 6 }}>🛡️</Text>
                  <Text style={[styles.secureNoticeText, { fontSize: scale(10) }]}>
                    Intercambio protegido: Comunidad verificada con validación DNI.
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 2: FORMULARIO DE PUBLICACIÓN EN AYUDA SOLIDARIA */}
      <Modal visible={publishModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: scale(16) }]}>
                Nueva Publicación Solidaria
              </Text>
              <TouchableOpacity onPress={() => setPublishModalVisible(false)}>
                <Text style={{ fontSize: 22, color: COLORS.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: 60 }} style={{ maxHeight: 520, padding: 16 }}>
              {/* Selector de Tipo de Publicación */}
              <Text style={[styles.formLabel, { fontSize: scale(12) }]}>Tipo de ayuda:</Text>
              <View style={styles.typeSelectorGrid}>
                {[
                  { id: 'Necesito ayuda', label: '💬 Necesito ayuda', desc: 'Pedir un favor a vecinos' },
                  { id: 'Puedo apoyar', label: '🤝 Puedo apoyar', desc: 'Ofrecer ayuda voluntaria' },
                  { id: 'Donación', label: '📦 Donación', desc: 'Regalar algo que no usas' },
                  { id: 'Intercambio', label: '🔄 Intercambio', desc: 'Trueque solidario vecinal' }
                ].map((t) => {
                  const isSel = newPostType === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.typeOptionCard, isSel && styles.typeOptionCardSelected]}
                      onPress={() => setNewPostType(t.id)}
                    >
                      <Text style={[styles.typeOptionLabel, isSel && styles.typeOptionLabelSelected, { fontSize: scale(11) }]}>
                        {t.label}
                      </Text>
                      <Text style={[styles.typeOptionDesc, { fontSize: scale(9) }]}>
                        {t.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Título */}
              <Text style={[styles.formLabel, { fontSize: scale(12), marginTop: 12 }]}>Título breve *</Text>
              <TextInput
                style={[styles.formInput, { fontSize: scale(12) }]}
                placeholder="Ej: Necesito una escalera por 1 hora..."
                value={newPostTitle}
                onChangeText={setNewPostTitle}
              />

              {/* Categoría */}
              <Text style={[styles.formLabel, { fontSize: scale(12), marginTop: 12 }]}>Categoría:</Text>
              <View style={styles.catChipsRow}>
                {['Herramientas', 'Apoyo temporal', 'Donaciones', 'Intercambio', 'Cuidado'].map((c) => {
                  const isSel = newPostCategory === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.catChip, isSel && styles.catChipSelected]}
                      onPress={() => setNewPostCategory(c)}
                    >
                      <Text style={[styles.catChipText, isSel && styles.catChipTextSelected, { fontSize: scale(10) }]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Descripción */}
              <Text style={[styles.formLabel, { fontSize: scale(12), marginTop: 12 }]}>Detalle / Explicación:</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea, { fontSize: scale(12) }]}
                placeholder="Describe brevemente tu necesidad para que tus vecinos entiendan cómo ayudarte..."
                value={newPostDesc}
                onChangeText={setNewPostDesc}
                multiline
                numberOfLines={3}
              />

              {/* Horario o Disponibilidad */}
              <Text style={[styles.formLabel, { fontSize: scale(12), marginTop: 12 }]}>¿Cuándo lo necesitas o cuándo puedes?</Text>
              <TextInput
                style={[styles.formInput, { fontSize: scale(12) }]}
                placeholder="Ej: Hoy hasta las 6pm, o este sábado por la mañana"
                value={newPostDate}
                onChangeText={setNewPostDate}
              />

              {/* Mensaje de manzana */}
              <View style={styles.formLocationNotice}>
                <Text style={{ fontSize: 16, marginRight: 6 }}>📍</Text>
                <Text style={[styles.formLocationText, { fontSize: scale(10) }]}>
                  Se publicará para vecinos verificados de Zona A – Manzana 2.
                </Text>
              </View>

              {/* Botón de Publicar */}
              <TouchableOpacity
                style={styles.submitSolidarityButton}
                activeOpacity={0.8}
                onPress={handlePublishSolidarity}
              >
                <Text style={[styles.submitSolidarityText, { fontSize: scale(14) }]}>
                  🚀 Publicar en el Muro Solidario
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
    paddingBottom: 90
  },
  headerCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: COLORS.primaryDeep,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12
  },
  subtabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4
  },
  subtabActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  subtabInactive: {
    backgroundColor: 'transparent'
  },
  subtabText: {
    fontWeight: '800'
  },
  subtabTextActive: {
    color: COLORS.primaryDeep
  },
  subtabTextInactive: {
    color: COLORS.white
  },
  urgentBadge: {
    backgroundColor: COLORS.emergency,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8
  },
  urgentBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900'
  },
  communityQuote: {
    color: '#e0f2fe',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 14
  },
  balanceGrid: {
    flexDirection: 'row',
    gap: 10
  },
  balanceBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center'
  },
  balanceLabel: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2
  },
  balanceNumberHelped: {
    fontWeight: '900',
    color: COLORS.primaryDeep
  },
  balanceNumberReceived: {
    fontWeight: '900',
    color: COLORS.textPrimary
  },
  balanceSub: {
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2
  },
  categoriesScroll: {
    marginBottom: 14
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
    color: COLORS.primaryDeep,
    fontWeight: '900'
  },
  publishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: COLORS.primaryPale,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16
  },
  publishCardTitle: {
    fontWeight: '900',
    color: COLORS.primaryDeep
  },
  publishCardSub: {
    color: COLORS.primaryDark,
    fontWeight: '500',
    marginTop: 2
  },
  publishBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2
  },
  publishBtnText: {
    color: COLORS.white,
    fontWeight: '900'
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.5
  },
  blockTagWrap: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  blockTag: {
    fontWeight: '700',
    color: COLORS.primaryDark
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginVertical: 14
  },
  emptyTitle: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6
  },
  emptySub: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18
  },
  emptyActionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14
  },
  emptyActionBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13
  },
  postCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  tagWrap: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
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
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  postDesc: {
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  authorName: {
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  wantHelpBtn: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  wantHelpBtnText: {
    color: COLORS.primaryDeep,
    fontWeight: '900'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5
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
    marginTop: 12
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
