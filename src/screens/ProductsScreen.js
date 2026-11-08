import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Image
} from 'react-native';
import { COLORS } from '../theme/colors';
import { api } from '../api/apiClient';

export default function ProductsScreen({
  onNavigate,
  fontScale = 1.0,
  onOpenDetail,
  onOpenChat
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const scale = (val) => Math.round(val * fontScale);

  const categories = [
    { id: 'all', name: 'Todos', icon: '▦' },
    { id: 'Panadería y Masas', name: 'Panadería', icon: '🍞' },
    { id: 'Comida Casera y Menú', name: 'Comida Casera', icon: '🍲' },
    { id: 'Verduras, Frutas y Abarrotes', name: 'Abarrotes', icon: '🥦' },
    { id: 'Repostería y Postres', name: 'Repostería', icon: '🍰' },
    { id: 'Artesanía y Confección', name: 'Confección', icon: '🧵' }
  ];

  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [searchQuery, activeCategory]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({ q: searchQuery });
      const filtered = (data || []).filter((prod) => {
        const cat = prod.category || prod.category_name;
        return activeCategory === 'all' || cat === activeCategory;
      });
      setProductsList(filtered);
    } catch {
      setProductsList([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = productsList;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Cabecera Verde Azulado */}
      <View style={styles.headerBox}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerLeft}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>🏪</Text>
            <View>
              <Text style={[styles.headerTitle, { fontSize: scale(17) }]}>
                Productos Locales
              </Text>
              <Text style={[styles.headerSub, { fontSize: scale(11) }]}>
                Emprendimientos de tu vecindario • Zona A
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.publishShortcutBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('publish')}
          >
            <Text style={[styles.publishShortcutText, { fontSize: scale(11) }]}>
              + Vender
            </Text>
          </TouchableOpacity>
        </View>

        {/* Buscador de Productos */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { fontSize: scale(12) }]}
            placeholder="Buscar pan casero, empanadas, miel..."
            placeholderTextColor="#94a3b8"
            returnKeyType="search"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ fontSize: 14, color: COLORS.textMuted }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categorías de Productos */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                isActive && styles.categoryPillActive
              ]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text style={{ fontSize: 13, marginRight: 4 }}>{cat.icon}</Text>
              <Text
                style={[
                  styles.categoryPillText,
                  isActive && styles.categoryPillTextActive,
                  { fontSize: scale(11) }
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Radar de Negocios Cercanos */}
      <View style={styles.radarCard}>
        <View style={styles.radarIconWrap}>
          <Text style={{ fontSize: 24 }}>📍</Text>
        </View>
        <View style={styles.radarInfo}>
          <Text style={[styles.radarTitle, { fontSize: scale(12) }]}>
            Comercio a tu paso
          </Text>
          <Text style={[styles.radarSub, { fontSize: scale(10) }]}>
            {filteredProducts.length} producto{filteredProducts.length === 1 ? '' : 's'} en Zona A
          </Text>
        </View>
        <Text style={styles.radarBadge}>Mz. 1 - Mz. 4</Text>
      </View>

      {/* Título de la Sección */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { fontSize: scale(13) }]}>
          PRODUCTOS DISPONIBLES HOY
        </Text>
        <Text style={[styles.resultsCount, { fontSize: scale(11) }]}>
          {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
        </Text>
      </View>

      {/* Grid / Lista de Productos o Empty State */}
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 48, marginBottom: 10 }}>🧺</Text>
          <Text style={[styles.emptyTitle, { fontSize: scale(15) }]}>
            Aún no hay productos en tu manzana
          </Text>
          <Text style={[styles.emptySub, { fontSize: scale(11) }]}>
            ¡Sé el primero en ofrecer productos caseros, panadería o abarrotes a tus vecinos!
          </Text>
          <TouchableOpacity
            style={styles.emptyPublishBtn}
            onPress={() => onNavigate('publish')}
          >
            <Text style={styles.emptyPublishBtnText}>+ Publicar Producto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.productsGrid}>
          {filteredProducts.map((prod) => (
            <TouchableOpacity
              key={prod.id}
              style={styles.productCard}
              activeOpacity={0.88}
              onPress={() => {
                if (onOpenDetail) {
                  onOpenDetail(prod, 'product');
                }
              }}
            >
              {/* Imagen del Producto */}
              <View style={styles.imageWrap}>
                {prod.image_url ? (
                  <Image
                    source={{ uri: prod.image_url }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.noImageWrap}>
                    <Text style={{ fontSize: 32 }}>🍞</Text>
                  </View>
                )}
                <View style={styles.priceTag}>
                  <Text style={styles.priceTagText}>
                    S/ {Number(prod.price || 0).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Contenido de la Tarjeta */}
              <View style={styles.cardBody}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {prod.category_name || prod.category || 'Venta Barrial'}
                  </Text>
                </View>

                <Text
                  style={[styles.productName, { fontSize: scale(13) }]}
                  numberOfLines={1}
                >
                  {prod.name}
                </Text>

                <Text
                  style={[styles.productDesc, { fontSize: scale(10) }]}
                  numberOfLines={2}
                >
                  {prod.description}
                </Text>

                {/* Vendedor y Valoración */}
                <View style={styles.sellerRow}>
                  <View style={styles.sellerLeft}>
                    {prod.seller_avatar ? (
                      <Image
                        source={{ uri: prod.seller_avatar }}
                        style={styles.sellerAvatar}
                      />
                    ) : (
                      <Text style={{ fontSize: 14 }}>👤</Text>
                    )}
                    <Text
                      style={[styles.sellerName, { fontSize: scale(10) }]}
                      numberOfLines={1}
                    >
                      {prod.seller_name || 'Vecino'}
                    </Text>
                  </View>
                  <Text style={[styles.ratingText, { fontSize: scale(10) }]}>
                    ⭐ {prod.rating || 5.0}
                  </Text>
                </View>

                {/* Ubicación y Distancia */}
                <Text style={[styles.locationText, { fontSize: scale(9) }]}>
                  📍 {prod.block_code || 'Zona A'} • a {prod.distance_m || 100} m
                </Text>

                {/* Botones de Acción */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.viewDetailBtn}
                    onPress={() => {
                      if (onOpenDetail) onOpenDetail(prod, 'product');
                    }}
                  >
                    <Text style={[styles.viewDetailBtnText, { fontSize: scale(10) }]}>
                      Ver detalle
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.chatActionBtn}
                    onPress={() => {
                      if (onOpenChat) {
                        onOpenChat({
                          name: prod.seller_name || 'Vecino',
                          topic: `Pedido: ${prod.name}`,
                          avatar: prod.seller_avatar || '👤',
                          zone: prod.block_code || 'Zona A',
                          badge: 'Vendedor Verificado',
                          phone: prod.phone || '987-654-321'
                        });
                      }
                    }}
                  >
                    <Text style={styles.chatActionBtnText}>💬 Pedir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
    paddingBottom: 100
  },
  headerBox: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerTitle: {
    fontWeight: '900',
    color: COLORS.primaryDark
  },
  headerSub: {
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  publishShortcutBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  publishShortcutText: {
    color: COLORS.white,
    fontWeight: '800'
  },
  searchBar: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  searchInput: {
    flex: 1,
    fontWeight: '600',
    color: '#0f172a'
  },
  categoriesScroll: {
    marginBottom: 12
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  categoryPillText: {
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  categoryPillTextActive: {
    color: COLORS.white
  },
  radarCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginBottom: 14
  },
  radarIconWrap: {
    marginRight: 10
  },
  radarInfo: {
    flex: 1
  },
  radarTitle: {
    fontWeight: '800',
    color: '#92400e'
  },
  radarSub: {
    color: '#b45309',
    fontWeight: '600'
  },
  radarBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionTitle: {
    fontWeight: '900',
    color: COLORS.textPrimary
  },
  resultsCount: {
    fontWeight: '700',
    color: COLORS.textMuted
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginTop: 10
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
  emptyPublishBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14
  },
  emptyPublishBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  productCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2
  },
  imageWrap: {
    height: 120,
    backgroundColor: '#f1f5f9',
    position: 'relative'
  },
  productImage: {
    width: '100%',
    height: '100%'
  },
  noImageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  priceTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: COLORS.primaryDeep,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  priceTagText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 11
  },
  cardBody: {
    padding: 10
  },
  categoryBadge: {
    backgroundColor: COLORS.primarySurface,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primaryDark
  },
  productName: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2
  },
  productDesc: {
    color: COLORS.textSecondary,
    lineHeight: 14,
    marginBottom: 6
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  sellerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4
  },
  sellerAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8
  },
  sellerName: {
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  ratingText: {
    color: COLORS.amber,
    fontWeight: '800'
  },
  locationText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 8
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 6
  },
  viewDetailBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center'
  },
  viewDetailBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '700'
  },
  chatActionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center'
  },
  chatActionBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 10
  }
});
