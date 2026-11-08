import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { COLORS } from '../theme/colors';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getOrDetectUserLocation } from '../services/locationService';

export default function ProductsScreen({
  onNavigate,
  fontScale = 1.0,
  onOpenDetail,
  onOpenChat
}) {
  const { session, profile } = useAuth();
  const currentUserId = session?.user?.id || profile?.id;
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const debounceRef = useRef(null);

  const scale = (val) => Math.round(val * fontScale);

  const [categories, setCategories] = useState([
    { id: 'all', name: 'Todos', icon: '▦' }
  ]);

  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrDetectUserLocation().then((loc) => {
      if (loc) setUserLocation(loc);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [activeCategory, userLocation]);

  const loadCategories = async () => {
    try {
      const data = await api.getProductCategories();
      if (Array.isArray(data) && data.length > 0) {
        setCategories([
          { id: 'all', name: 'Todos', icon: '▦' },
          ...data.map((c) => ({
            id: c.name,
            name: c.name,
            icon: '🏪'
          }))
        ]);
      }
    } catch (err) {
      console.warn('[ProductsScreen] Error cargando categorías de BD:', err);
    }
  };

  const confirmDeleteProduct = (prod) => {
    Alert.alert(
      '¿Eliminar producto?',
      `¿Deseas eliminar "${prod.name || prod.title}" de la tienda comunitaria?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteProduct(prod.id, session?.access_token || null);
              Alert.alert('Eliminado', 'Tu producto ha sido retirado.');
              loadProducts();
            } catch (err) {
              Alert.alert('Aviso', err.message || 'No se pudo eliminar el producto.');
            }
          }
        }
      ]
    );
  };

  const loadProducts = async (searchTerm = searchQuery) => {
    setLoading(true);
    try {
      // Consumir el endpoint especializado de búsqueda geolocalizada de productos
      const res = await api.searchProducts({
        q: searchTerm?.trim() || null,
        latitude: userLocation?.latitude || null,
        longitude: userLocation?.longitude || null,
        sort: 'recommended',
        page: 1,
        page_size: 40
      });

      if (res && Array.isArray(res.items)) {
        const filtered = res.items.filter((prod) => {
          const cat = prod.category || prod.category_name;
          return activeCategory === 'all' || cat === activeCategory;
        });
        setProductsList(filtered);
      } else {
        const data = await api.getProducts({ q: searchTerm }).catch(() => []);
        const filtered = (data || []).filter((prod) => {
          const cat = prod.category || prod.category_name;
          return activeCategory === 'all' || cat === activeCategory;
        });
        setProductsList(filtered);
      }
    } catch (err) {
      console.warn('[ProductsScreen] Error al buscar productos:', err);
      setProductsList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadProducts(text);
    }, 350);
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
        {/* Selector de Pestaña: Servicios vs Productos Locales */}
        <View style={styles.tabToggleRow}>
          <TouchableOpacity
            style={styles.tabToggleBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('services')}
          >
            <Ionicons name="construct-outline" size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.tabToggleBtnText, { fontSize: scale(11) }]}>
              Servicios y Oficios
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabToggleBtn, styles.tabToggleBtnActive]}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="storefront" size={15} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={[styles.tabToggleBtnText, styles.tabToggleBtnTextActive, { fontSize: scale(11) }]}>
              Productos Locales
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerTitleRow}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="storefront" size={26} color={COLORS.primaryDark} style={{ marginRight: 8 }} />
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
            onPress={() => onNavigate('publish', { type: 'producto' })}
          >
            <Ionicons name="add" size={14} color="#ffffff" style={{ marginRight: 2 }} />
            <Text style={[styles.publishShortcutText, { fontSize: scale(11) }]}>
              Vender
            </Text>
          </TouchableOpacity>
        </View>

        {/* Buscador de Productos */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color="#94a3b8" style={{ marginRight: 6 }} />
          <TextInput
            style={[styles.searchInput, { fontSize: scale(12) }]}
            placeholder="Buscar pan casero, empanadas, miel..."
            placeholderTextColor="#94a3b8"
            returnKeyType="search"
            value={searchQuery}
            onChangeText={handleSearchChange}
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
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                isSelected && styles.categoryChipActive
              ]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text style={{ fontSize: 14, marginRight: 5 }}>{cat.icon}</Text>
              <Text
                style={[
                  styles.categoryText,
                  isSelected && styles.categoryTextActive,
                  { fontSize: scale(11) }
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Listado de Productos */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { fontSize: scale(12) }]}>
            Cargando productos de tu comunidad...
          </Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="basket-outline" size={44} color="#94a3b8" style={{ marginBottom: 8 }} />
          <Text style={[styles.emptyTitle, { fontSize: scale(15) }]}>
            Aún no hay productos en tu manzana
          </Text>
          <Text style={[styles.emptySub, { fontSize: scale(11) }]}>
            ¡Sé el primero en ofrecer productos caseros, panadería o abarrotes a tus vecinos!
          </Text>
          <TouchableOpacity
            style={styles.emptyPublishBtn}
            onPress={() => onNavigate('publish', { type: 'producto' })}
          >
            <Ionicons name="add" size={16} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.emptyPublishBtnText}>Publicar Producto</Text>
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
                    <MaterialCommunityIcons name="storefront-outline" size={32} color={COLORS.primaryDark} />
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
                      <Ionicons name="person-circle" size={16} color={COLORS.primaryDark} />
                    )}
                    <Text
                      style={[styles.sellerName, { fontSize: scale(10) }]}
                      numberOfLines={1}
                    >
                      {prod.seller_name || 'Vecino'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="star" size={11} color="#f59e0b" style={{ marginRight: 2 }} />
                    <Text style={[styles.ratingText, { fontSize: scale(10) }]}>
                      {prod.rating || 5.0}
                    </Text>
                  </View>
                </View>

                {/* Ubicación y Distancia */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                  <Ionicons name="location-sharp" size={11} color="#0d9488" style={{ marginRight: 2 }} />
                  <Text style={[styles.locationText, { fontSize: scale(9) }]}>
                    {prod.block_code || 'Zona A'} • a {prod.distance_m || 100} m
                  </Text>
                </View>

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

                  {currentUserId && (prod.seller_id === currentUserId || prod.user_id === currentUserId) ? (
                    <TouchableOpacity
                      style={styles.cardDeleteBtn}
                      onPress={() => confirmDeleteProduct(prod)}
                    >
                      <Ionicons name="trash-outline" size={15} color="#ef4444" />
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.chatActionBtn}
                    onPress={() => {
                      if (onOpenChat) {
                        onOpenChat({
                          id: prod.seller_id || prod.user_id || 'vendedor',
                          name: prod.seller_name || 'Vendedor VeciRed',
                          avatar: prod.seller_avatar || '🏪',
                          subject: `Consulta sobre producto: ${prod.name}`
                        });
                      }
                    }}
                  >
                    <Ionicons name="chatbubbles" size={13} color="#ffffff" style={{ marginRight: 3 }} />
                    <Text style={[styles.chatActionBtnText, { fontSize: scale(10) }]}>
                      Chat
                    </Text>
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
    paddingBottom: 90
  },
  headerBox: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 3,
    marginBottom: 12
  },
  tabToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 11
  },
  tabToggleBtnActive: {
    backgroundColor: COLORS.primaryDark,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  tabToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  tabToggleBtnTextActive: {
    color: '#ffffff'
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerTitle: {
    fontWeight: '800',
    color: COLORS.primaryDark
  },
  headerSub: {
    color: COLORS.textSecondary,
    fontWeight: '500'
  },
  publishShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  publishShortcutText: {
    color: COLORS.white,
    fontWeight: '800'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontWeight: '500'
  },
  categoriesScroll: {
    marginBottom: 12
  },
  categoriesContainer: {
    paddingRight: 16
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8
  },
  categoryChipActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  categoryTextActive: {
    color: COLORS.white,
    fontWeight: '800'
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 10,
    fontWeight: '500'
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10
  },
  emptyTitle: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  emptySub: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18
  },
  emptyPublishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
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
    justifyContent: 'space-between',
    gap: 12
  },
  productCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2
  },
  imageWrap: {
    width: '100%',
    height: 110,
    position: 'relative'
  },
  productImage: {
    width: '100%',
    height: '100%'
  },
  noImageWrap: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  priceTag: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  priceTagText: {
    color: '#34d399',
    fontWeight: '900',
    fontSize: 11
  },
  cardBody: {
    padding: 10
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4
  },
  categoryBadgeText: {
    color: '#2563eb',
    fontSize: 9,
    fontWeight: '800'
  },
  productName: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2
  },
  productDesc: {
    color: COLORS.textSecondary,
    marginBottom: 6,
    lineHeight: 14
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
    marginRight: 4
  },
  sellerAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 4
  },
  sellerName: {
    color: '#64748b',
    fontWeight: '600'
  },
  ratingText: {
    color: '#f59e0b',
    fontWeight: '800'
  },
  locationText: {
    color: '#0d9488',
    fontWeight: '700',
    marginBottom: 8
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  viewDetailBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center'
  },
  viewDetailBtnText: {
    color: '#475569',
    fontWeight: '700'
  },
  cardDeleteBtn: {
    backgroundColor: '#fef2f2',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8
  },
  chatActionBtnText: {
    color: COLORS.white,
    fontWeight: '800'
  }
});
