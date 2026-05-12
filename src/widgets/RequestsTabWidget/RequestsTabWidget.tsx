import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { SectionHeader } from '../../shared/ui/SectionHeader';
import { colors } from '../../shared/theme/colors';

// Заглушка для иконок (вместо SVG)
const IconPlaceholder = ({ color = '#000' }) => (
  <View style={{ width: 22, height: 22, backgroundColor: color, borderRadius: 4 }} />
);

// Заглушка для стрелочки
const ArrowPlaceholder = () => (
  <Text style={{ fontSize: 18, color: '#CCC' }}>→</Text>
);

type RequestType = 'ideas' | 'management' | 'science' | 'service' | 'service1';

const TABS: { key: RequestType; titleKey: string }[] = [
  { key: 'ideas', titleKey: 'Нарушение ТК' },
  { key: 'management', titleKey: 'Условия труда' },
  { key: 'science', titleKey: 'Оплата труда' },
  { key: 'service', titleKey: 'Социальные льготы' },
  { key: 'service1', titleKey: 'Предложение по коллективному договору' },
];

const TAB_COLORS: Record<RequestType, string> = {
  ideas: '#C9F2FF',
  management: '#FFF1B7',
  science: '#FFE9B1',
  service: '#F4FFB5',
  service1: '#F4FFB5',
};

// ТЕСТОВЫЕ ДАННЫЕ
const MOCK_DATA: Record<RequestType, any[]> = {
  ideas: [
    { id: '1', title: 'Оптимизация столовой', description: 'Предложение по внедрению системы предзаказа обедов через приложение.' },
    { id: '2', title: 'Зеленый офис', description: 'Установка контейнеров для раздельного сбора мусора на всех этажах.' },
  ],
  management: [
    { id: '3', title: 'Новый KPI', description: 'Обсуждение системы мотивации для сотрудников логистического отдела.' },
  ],
  science: [
    { id: '4', title: 'Исследование полимеров', description: 'Отчет о результатах испытаний новых материалов в лаборатории.' },
  ],
  service: [
    { id: '5', title: 'Техподдержка 24/7', description: 'Заявка на расширение штата ночной смены системных администраторов.' },
  ],
  service1: [
    { id: '6', title: 'Техподдержка 24/7', description: 'Заявка на расширение штата ночной смены системных администраторов.' },
  ],
};

export const RequestsTabWidget = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  // Оставляем только состояние активного таба
  const [activeTab, setActiveTab] = useState<RequestType>('ideas');

  const currentData = MOCK_DATA[activeTab];

  return (
    <View style={styles.container}>
      {/* 1. ТАБЫ (Горизонтальный список) */}
      <View style={styles.tabsWrapper}>
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.tabButton,
                activeTab === item.key && styles.activeTab,
              ]}
              onPress={() => setActiveTab(item.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === item.key && styles.activeTabText,
                ]}
              >
                {item.titleKey}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* 2. ЗАГОЛОВОК СЕКЦИИ */}
      <SectionHeader
        title={TABS.find(tab => tab.key === activeTab)?.titleKey ?? ''}
        onPressAction={() => navigation.navigate('RequestsList', { requestType: activeTab })}
      />

      {/* 3. СПИСОК КАРТОЧЕК */}
      <ScrollView style={styles.cardsContainer} scrollEnabled={false}>
        {currentData.map(card => (
          <Pressable
            key={card.id}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => navigation.navigate('RequestsList', { requestType: activeTab })}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: TAB_COLORS[activeTab] },
              ]}
            >
              <IconPlaceholder color="rgba(0,0,0,0.3)" />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {card.title}
              </Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {card.description}
              </Text>
            </View>

            <ArrowPlaceholder />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  tabsWrapper: {
    marginHorizontal: -15,
    marginBottom: 15
  },
  tabsContent: {
    paddingHorizontal: 15,
  },
  tabButton: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 24,
    marginRight: 8,
    backgroundColor: 'rgb(211, 215, 221);', // Фон для неактивных табов
  },
  activeTab: {
    backgroundColor: 'rgba(37, 99, 235, 1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgb(88, 88, 88)',
  },
  activeTabText: {
    color: '#fff',
  },
  cardsContainer: {
    marginTop: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 10,
    // Легкая тень для карточки
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    gap: 4,
    marginRight: 10,
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: '#002F42',
  },
  cardDescription: {
    fontSize: 12,
    color: '#878787',
    lineHeight: 16,
  },
});