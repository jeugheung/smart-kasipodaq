 import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { StyleSheet, FlatList, View, Text, Animated, Easing, TouchableOpacity, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
// ВАЖНО: Импортируем TouchableOpacity из bottom-sheet для работы кнопок внутри модалки!
import BottomSheet, { 
  BottomSheetView, 
  BottomSheetBackdrop, 
  TouchableOpacity as BottomSheetTouchableOpacity 
} from '@gorhom/bottom-sheet';
import { Calendar, LocaleConfig } from 'react-native-calendars';
// Если используешь Expo, замени на: import { Feather as Icon } from '@expo/vector-icons';
import { Feather as Icon } from '@expo/vector-icons'

// import { HomeFlowStackParamList } from "../HomeFlowNavigator";


import { colors } from "@shared/theme/colors";

import { getNews } from "@shared/api/endpoints";

import { useTranslation } from "react-i18next";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import { NewsItem } from "@entities/NewsCard";
import { NewsItemCard } from "@entities/NewsItemCard";
import { SharedLoader } from "@shared/ui/SharedLoader/SharedLoader";

// import { NewsItem } from "@entities/NewsCard";

// --- Настройка русской локали для Календаря ---
LocaleConfig.locales['ru'] = {
  monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  monthNamesShort: ['Янв.', 'Фев.', 'Март', 'Апр.', 'Май', 'Июнь', 'Июль', 'Авг.', 'Сент.', 'Окт.', 'Нояб.', 'Дек.'],
  dayNames: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  today: 'Сегодня'
};
LocaleConfig.defaultLocale = 'ru';

// type Props = NativeStackScreenProps<HomeFlowStackParamList, "NewsPage">;

// --- Лоадер для конца списка ---
const NewsLoader = () => {
  const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [rotate]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={styles.footerLoaderWrapper}>
      <View style={styles.loaderBox}>
        <Animated.View style={[styles.customSpinner, { transform: [{ rotate: spin }] }]} />
      </View>
    </View>
  );
};

export const NewsPage = ({ navigation }: any) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // --- Стейты для BottomSheet ---
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['90%'], []); 
  const [activeTab, setActiveTab] = useState<'from' | 'to'>('from');
  
  // Утвержденные даты для фильтрации
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Временные даты (при выборе в календаре)
  const [tempStart, setTempStart] = useState<string | null>(null);
  const [tempEnd, setTempEnd] = useState<string | null>(null);

  const { i18n, t } = useTranslation();
  const lang = i18n.language;
  const isFetching = useRef(false);

  const mapNews = useCallback((data: any[]) => {
    return data.map((item: any) => ({
      id: item.id.toString(),
      title: lang === "kk" ? item.title_kz : lang === "en" ? item.title_en : item.title_ru,
      date: lang === "kk" ? item.date_kz : lang === "en" ? item.date_en : item.date_ru,
      text: lang === "kk" ? item.full_text_kz : lang === "en" ? item.full_text_en : item.full_text_ru,
      img: `https://satbayev.university${item.image}`,
    }));
  }, [lang]);

  const loadNews = async (pageNumber: number, isRefresh = false) => {
    if (isFetching.current) return;
    if (!hasMore && !isRefresh) return;

    isFetching.current = true;
    if (pageNumber > 1) setLoadingMore(true);

    try {
      // Здесь потом можно добавить: await getNews(pageNumber, startDate, endDate)
      const response = await getNews(pageNumber); 
      const mapped = mapNews(response);

      if (pageNumber > 1) await new Promise(resolve => setTimeout(resolve, 300));

      if (isRefresh || pageNumber === 1) {
        setNews(mapped);
        setPage(1);
        setHasMore(response.length >= 15);
      } else {
        setNews((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const unique = mapped.filter((item) => !existingIds.has(item.id));
          return [...prev, ...unique];
        });
        setPage(pageNumber);
        setHasMore(response.length >= 15);
      }
    } catch (e) {
      console.log("❌ ERROR:", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setTimeout(() => { isFetching.current = false; }, 200);
    }
  };

  useEffect(() => {
    setLoading(true);
    setHasMore(true);
    loadNews(1, true);
  }, [lang, startDate, endDate]);

  const handleLoadMore = () => {
    if (isFetching.current || !hasMore || loading) return;
    loadNews(page + 1);
  };

  const renderFooter = () => {
    if (!hasMore && news.length > 0) {
      return <Text style={styles.endText}>{t("news.allCaughtUp") || "Это все новости"}</Text>;
    }
    if (!loadingMore) return <View style={{ height: 60 }} />;

    return <NewsLoader />;
  };

  // --- Обработчики Фильтра ---
  const handleOpenFilter = () => {
    setTempStart(startDate);
    setTempEnd(endDate);
    setActiveTab('from');
    bottomSheetRef.current?.expand();
  };

  const handleCloseFilter = () => {
    bottomSheetRef.current?.close();
  };

  const handleApplyFilter = () => {
    if (!tempStart || !tempEnd) {
      Alert.alert("Внимание", "Пожалуйста, выберите обе даты: начало (С) и конец (По) периода.");
      return;
    }

    if (new Date(tempStart) > new Date(tempEnd)) {
      Alert.alert("Ошибка", "Дата 'По' не может быть раньше даты 'С'.");
      return;
    }

    setStartDate(tempStart);
    setEndDate(tempEnd);
  
    
    console.log("🔥 Установлен период дат:", { startDate: tempStart, endDate: tempEnd });
    bottomSheetRef.current?.close();
  };

  const handleResetFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setTempStart(null);
    setTempEnd(null);
    console.log("♻️ Фильтр сброшен");
  };

  const onDayPress = (day: any) => {
    if (activeTab === 'from') {
      setTempStart(day.dateString);
      setActiveTab('to'); 
    } else {
      setTempEnd(day.dateString);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '...';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  const markedDates: any = {};
  if (tempStart) markedDates[tempStart] = { startingDay: true, color: '#002F42', textColor: 'white' };
  if (tempEnd) markedDates[tempEnd] = { endingDay: true, color: '#002F42', textColor: 'white' };

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  return (
    <DefaultLayout variant="back" title={t("news.title")} scrollEnabled={false}>
      <View style={{ flex: 1 }}>
        
        {/* КРАСИВЫЙ ФИЛЬТР ХЕДЕР С ИКОНКАМИ */}
        <View style={styles.filterHeader}>
          <TouchableOpacity 
            style={[styles.filterButton, startDate && styles.filterButtonActive]} 
            onPress={handleOpenFilter}
          >
            <View style={styles.filterButtonContent}>
              <Icon 
                name="calendar" 
                size={18} 
                color={startDate ? '#FFFFFF' : '#002F42'} 
              />
              <Text style={[styles.filterButtonText, startDate && styles.filterButtonTextActive]}>
                {startDate && endDate 
                  ? `${formatDate(startDate)}  —  ${formatDate(endDate)}` 
                  : "Выбрать период"
                }
              </Text>
            </View>
          </TouchableOpacity>
          
          {startDate && endDate && (
            <TouchableOpacity style={styles.resetIcon} onPress={handleResetFilter}>
              <Icon name="x" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={news}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => <NewsItemCard news={item} />}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          refreshing={false}
          onRefresh={() => {
            setHasMore(true);
            loadNews(1, true);
          }}
        />
      </View>
      
      <SharedLoader visible={loading && news.length === 0} />

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Период новостей</Text>

          {/* Используем BottomSheetTouchableOpacity внутри модалки! */}
          <View style={styles.segmentContainer}>
            <BottomSheetTouchableOpacity 
              style={[styles.segmentButton, activeTab === 'from' && styles.segmentActive]}
              onPress={() => setActiveTab('from')}
            >
              <Text style={[styles.segmentText, activeTab === 'from' && styles.segmentTextActive]}>
                С: {formatDate(tempStart)}
              </Text>
            </BottomSheetTouchableOpacity>
            <BottomSheetTouchableOpacity 
              style={[styles.segmentButton, activeTab === 'to' && styles.segmentActive]}
              onPress={() => setActiveTab('to')}
            >
              <Text style={[styles.segmentText, activeTab === 'to' && styles.segmentTextActive]}>
                По: {formatDate(tempEnd)}
              </Text>
            </BottomSheetTouchableOpacity>
          </View>

          <View style={styles.calendarContainer}>
            <Calendar
              style={styles.calendar}
              onDayPress={onDayPress}
              markedDates={markedDates}
              markingType={'period'} 
              theme={{
                selectedDayBackgroundColor: '#002F42',
                todayTextColor: '#002F42',
                arrowColor: '#002F42',
              }}
            />
          </View>

          {/* Кнопки Установить / Отмена тоже переведены на BottomSheetTouchableOpacity */}
          <View style={styles.actionButtons}>
            <BottomSheetTouchableOpacity style={styles.cancelButton} onPress={handleCloseFilter}>
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </BottomSheetTouchableOpacity>
            <BottomSheetTouchableOpacity style={styles.applyButton} onPress={handleApplyFilter}>
              <Text style={styles.applyButtonText}>Установить</Text>
            </BottomSheetTouchableOpacity>
          </View>

        </BottomSheetView>
      </BottomSheet>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 20,
    backgroundColor: colors.background,
  },
  
  // --- СТИЛИ ХЕДЕРА ---
  filterHeader: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.background,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: '#002F42',
    marginRight: 10,
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#002F42',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  resetIcon: {
    backgroundColor: '#FEE2E2',
    width: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // --- Стили Bottom Sheet ---
  sheetContainer: {
    flex: 1,
    padding: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#002F42',
    textAlign: 'center',
    marginBottom: 20,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#002F42',
    fontWeight: '700',
  },
  calendarContainer: {
    flex: 1,
    marginTop: 10,
  },
  calendar: {
    height: 380, 
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#002F42',
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoaderWrapper: {
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  loaderBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  customSpinner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#F1F5F9',
    borderTopColor: '#002F42',
  },
  endText: {
    textAlign: "center",
    color: "#888",
    marginVertical: 30,
    fontSize: 12,
  },
});