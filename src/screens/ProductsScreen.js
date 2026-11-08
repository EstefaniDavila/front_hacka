import React, { useState } from 'react';
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
import { mockProducts } from '../data/mockData';

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
    { id: 'Panadería', name: 'Panadería', icon: '🍞' },
    { id: 'Comida Casera', name: 'Comida Casera', icon: '🍲' },
    { id: 'Alimentos Naturales', name: 'Naturales / Miel', icon: '🍯' },
    { id: 'Huerto y Jardín', name: 'Plantas / Huerto', icon: '🌱' }
  ];

  const filteredProducts = mockProducts.filter((prod) => {
    const matchesCategory =
      activeCategory === 'all' || prod.category === activeCategory;
    const matchesQuery =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.seller_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

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

      {/* Selector de Categorías Horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
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

      {/* Título de Resultados */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsTitle, { fontSize: scale(13) }]}>
          PRODUCTOS DISPONIBLES EN TU BARRIO ({filteredProducts.length})
        </Text>
        <Text style={[styles.resultsSub, { fontSize: scale(10) }]}>
          📍 Manzana 1 a 4
        </Text>
      </View>

      {/* Grid / Lista de Productos */}
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
                  S/ {prod.price.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Contenido de la Tarjeta */}
            <View style={styles.cardBody}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{prod.category}</Text>
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
                    <Text style={{ fontSize: 14 }}>👵</Text>
                  )}
                  <Text
                    style={[styles.sellerName, { fontSize: scale(10) }]}
                    numberOfLines={1}
                  >
                    {prod.seller_name}
                  </Text>
                </View>
                <Text style={[styles.ratingText, { fontSize: scale(10) }]}>
                  ⭐ {prod.rating}
                </Text>
              </View>

              {/* Ubicación y Distancia */}
              <Text style={[styles.locationText, { fontSize: scale(9) }]}>
                📍 {prod.block_code} • a {prod.distance_m} m
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
                        name: prod.seller_name,
                        topic: `Pedido: ${prod.name}`,
                        avatar: prod.seller_avatar || '👵',
                        zone: prod.block_code,
                        badge: 'Vendedora Vecinal',
                        phone: prod.phone
                      });
                    } else {
                      onNavigate('chat');
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    padding: 14,
    paddingBottom: 90,
    gap: 12
  },
  headerBox: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
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
    fontWeight: '900',
    color: COLORS.white
  },
  headerSub: {
    color: '#ccfbf1',
    fontWeight: '600'
  },
  publishShortcutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  publishShortcutText: {
    color: COLORS.white,
    fontWeight: '800'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
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
    paddingVertical: 7,
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
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2
  },
  resultsTitle: {
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  resultsSub: {
    color: COLORS.textSecondary,
    fontWeight: '700'
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  productCard: {
    width: '48.5%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2
  },
  imageWrap: {
    width: '100%',
    height: 120,
    backgroundColor: '#f1f5f9',
    position: 'relative'
  },
  productImage: {
    width: '100%',
    height: '100%'
  },
  noImageWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  priceTag: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  priceTagText: {
    color: '#fef08a',
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
    borderRadius: 4,
    marginBottom: 4
  },
  categoryBadgeText: {
    color: COLORS.primaryDeep,
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
