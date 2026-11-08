import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { api } from '../services/api';
import { getOrDetectUserLocation } from '../services/locationService';
import SearchResultCard from './SearchResultCard';

export default function GlobalSearchModal({
  visible,
  onClose,
  initialQuery = '',
  onSelectResult,
  fontScale = 1.0
}) {
  const scale = (val) => Math.round(val * fontScale);

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'services' | 'products' | 'solidarity' | 'emergencies'
  const [sortOption, setSortOption] = useState('recommended'); // 'recommended' | 'distance' | 'relevance'
  const [radiusKm, setRadiusKm] = useState(null); // null (toda la comunidad) | 1 | 3 | 5 | 10

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [sectionsSummary, setSectionsSummary] = useState({});

  const debounceTimerRef = useRef(null);

  // Cargar ubicación del usuario
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const loc = await getOrDetectUserLocation();
        if (isMounted && loc) {
          setUserLocation(loc);
        }
      } catch (e) {
        console.warn('[GlobalSearch] Error obteniendo ubicación:', e);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Sincronizar query inicial si cambia al abrir el modal
  useEffect(() => {
    if (visible) {
      setQuery(initialQuery || '');
      setPage(1);
      executeSearch(initialQuery || '', 1, activeTab, sortOption, radiusKm);
    }
  }, [visible, initialQuery]);

  // Manejar cambios en el texto con debounce (350ms)
  const handleQueryChange = (text) => {
    setQuery(text);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setPage(1);
      executeSearch(text, 1, activeTab, sortOption, radiusKm);
    }, 350);
  };

  // Cambio de pestaña de módulo o de ordenación
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    executeSearch(query, 1, tab, sortOption, radiusKm);
  };

  const handleSortChange = (newSort) => {
    setSortOption(newSort);
    setPage(1);
    executeSearch(query, 1, activeTab, newSort, radiusKm);
  };

  // Ejecución principal de la búsqueda llamando a los endpoints reales
  const executeSearch = async (qText, pageNum = 1, tab = activeTab, sort = sortOption, radius = radiusKm) => {
    const isFirstPage = pageNum === 1;
    if (isFirstPage) {
      setIsLoading(true);
      setErrorMsg('');
    } else {
      setIsLoadingMore(true);
    }

    try {
      const searchParams = {
        q: qText.trim() || null,
        latitude: userLocation?.latitude || null,
        longitude: userLocation?.longitude || null,
        radius_km: radius,
        sort,
        page: pageNum,
        page_size: 15
      };

      let result;
      if (tab === 'all') {
        result = await api.searchGlobal(searchParams);
        const fetchedItems = result?.items || [];
        setTotalResults(result?.total_results || 0);
        setTotalPages(result?.total_pages || 1);
        setSectionsSummary(result?.sections_summary || {});
        setItems(isFirstPage ? fetchedItems : (prev) => [...prev, ...fetchedItems]);
      } else if (tab === 'services') {
        result = await api.searchServices(searchParams);
        const fetched = (result?.items || []).map((it) => ({ ...it, module: 'services' }));
        setTotalResults(result?.meta?.total || 0);
        setTotalPages(result?.meta?.total_pages || 1);
        setItems(isFirstPage ? fetched : (prev) => [...prev, ...fetched]);
      } else if (tab === 'products') {
        result = await api.searchProducts(searchParams);
        const fetched = (result?.items || []).map((it) => ({ ...it, module: 'products' }));
        setTotalResults(result?.meta?.total || 0);
        setTotalPages(result?.meta?.total_pages || 1);
        setItems(isFirstPage ? fetched : (prev) => [...prev, ...fetched]);
      } else if (tab === 'solidarity') {
        result = await api.searchSolidarity(searchParams);
        const fetched = (result?.items || []).map((it) => ({ ...it, module: 'solidarity' }));
        setTotalResults(result?.meta?.total || 0);
        setTotalPages(result?.meta?.total_pages || 1);
        setItems(isFirstPage ? fetched : (prev) => [...prev, ...fetched]);
      } else if (tab === 'emergencies') {
        result = await api.searchEmergencies(searchParams);
        const fetched = (result?.items || []).map((it) => ({ ...it, module: 'emergencies' }));
        setTotalResults(result?.meta?.total || 0);
        setTotalPages(result?.meta?.total_pages || 1);
        setItems(isFirstPage ? fetched : (prev) => [...prev, ...fetched]);
      }
    } catch (err) {
      console.warn('[GlobalSearch] Error ejecutando búsqueda:', err);
      setErrorMsg(err.message || 'No fue posible completar la búsqueda comunitaria.');
      if (isFirstPage) setItems([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Paginación "Cargar más"
  const handleLoadMore = () => {
    if (!isLoading && !isLoadingMore && page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      executeSearch(query, nextPage, activeTab, sortOption, radiusKm);
    }
  };

  const tabs = [
    { id: 'all', label: 'Todo', count: totalResults },
    { id: 'services', label: 'Oficios', count: sectionsSummary.services },
    { id: 'products', label: 'Productos', count: sectionsSummary.products },
    { id: 'solidarity', label: 'Solidario', count: sectionsSummary.solidarity },
    { id: 'emergencies', label: 'Emergencias', count: sectionsSummary.emergencies }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.container}>

          {/* Barra superior con buscador y botón cerrar */}
          <View style={styles.searchHeader}>
            <View style={styles.searchInputWrap}>
              <Ionicons name="search" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { fontSize: scale(13) }]}
                placeholder="Busca oficios, productos, ayuda o emergencias..."
                placeholderTextColor="#94a3b8"
                value={query}
                onChangeText={handleQueryChange}
                autoFocus={true}
                returnKeyType="search"
                onSubmitEditing={() => executeSearch(query, 1)}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => handleQueryChange('')} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          {/* Indicador de ubicación activa */}
          {userLocation ? (
            <View style={styles.locationBar}>
              <Ionicons name="navigate-circle-outline" size={14} color="#0d9488" style={{ marginRight: 4 }} />
              <Text style={[styles.locationText, { fontSize: scale(10) }]} numberOfLines={1}>
                Cerca de {userLocation.district || 'tu comunidad'} ({userLocation.latitude.toFixed(3)}, {userLocation.longitude.toFixed(3)})
              </Text>
            </View>
          ) : null}

          {/* Pestañas de categorías con conteo real */}
          <View style={styles.tabsRow}>
            {tabs.map((t) => {
              const isSelected = activeTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tabPill, isSelected && styles.tabPillActive]}
                  onPress={() => handleTabChange(t.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabPillText, isSelected && styles.tabPillTextActive, { fontSize: scale(11) }]}>
                    {t.label}
                    {t.count !== undefined && t.count !== null ? ` (${t.count})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Opciones de ordenación rápida */}
          <View style={styles.sortRow}>
            <Text style={[styles.sortLabel, { fontSize: scale(10) }]}>Ordenar por:</Text>
            {[
              { id: 'recommended', label: 'Recomendados' },
              { id: 'distance', label: 'Más cercanos' },
              { id: 'relevance', label: 'Coincidencia' }
            ].map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => handleSortChange(s.id)}
                style={[styles.sortBtn, sortOption === s.id && styles.sortBtnActive]}
              >
                <Text style={[styles.sortBtnText, sortOption === s.id && styles.sortBtnTextActive, { fontSize: scale(10) }]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Lista de resultados */}
          {isLoading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[styles.loaderText, { fontSize: scale(12) }]}>
                Buscando en VeciRed con ranking inteligente...
              </Text>
            </View>
          ) : errorMsg ? (
            <View style={styles.errorWrap}>
              <Ionicons name="alert-circle-outline" size={40} color="#f43f5e" />
              <Text style={[styles.errorTitle, { fontSize: scale(13) }]}>No pudimos cargar los resultados</Text>
              <Text style={[styles.errorSub, { fontSize: scale(11) }]}>{errorMsg}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => executeSearch(query, 1)}>
                <Text style={styles.retryBtnText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(it, index) => it.id || String(index)}
              renderItem={({ item }) => (
                <SearchResultCard
                  item={item}
                  fontScale={fontScale}
                  onPress={(resItem, mod) => {
                    onClose();
                    if (onSelectResult) onSelectResult(resItem, mod);
                  }}
                />
              )}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.4}
              ListFooterComponent={
                isLoadingMore ? (
                  <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={{ fontSize: 44, marginBottom: 8 }}>🔍</Text>
                  <Text style={[styles.emptyTitle, { fontSize: scale(14) }]}>
                    {query.trim()
                      ? `No encontramos resultados para "${query}"`
                      : 'No hay publicaciones en esta categoría'}
                  </Text>
                  <Text style={[styles.emptySub, { fontSize: scale(11) }]}>
                    Prueba con términos más generales como "electricista", "pan", "ayuda" o cambia la categoría.
                  </Text>
                </View>
              }
            />
          )}

        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6
  },
  searchInput: {
    flex: 1,
    color: '#0f172a'
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  closeBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 13
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ccfbf1'
  },
  locationText: {
    color: '#0f766e',
    fontWeight: '600'
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 6
  },
  tabPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  tabPillActive: {
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: '#0d9488'
  },
  tabPillText: {
    color: '#64748b',
    fontWeight: '600'
  },
  tabPillTextActive: {
    color: '#0f766e',
    fontWeight: '800'
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    gap: 6
  },
  sortLabel: {
    color: '#64748b',
    fontWeight: '600',
    marginRight: 4
  },
  sortBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#e2e8f0'
  },
  sortBtnActive: {
    backgroundColor: COLORS.primary
  },
  sortBtnText: {
    color: '#475569',
    fontWeight: '600'
  },
  sortBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800'
  },
  listContent: {
    padding: 14,
    paddingBottom: 40
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  loaderText: {
    marginTop: 10,
    color: '#0f766e',
    fontWeight: '600'
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  errorTitle: {
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 10,
    marginBottom: 4
  },
  errorSub: {
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  emptyTitle: {
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 6
  },
  emptySub: {
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18
  }
});

