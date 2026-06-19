import { colors } from '@shared/theme/colors';
import { DefaultLayout } from '@widgets/Layout/DefaultLayout';
import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export const SurveyPage = ({ navigation }: any) => {
  return (
    <DefaultLayout
      variant="default"
      title="Smart Kasipodaq"
      onRightPress={() => alert('EN')}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Анкетирование</Text>
            <Text style={styles.pageSubtitle}>
              Участвуйте в важных решениях профсоюза
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countValue}>1</Text>
            <Text style={styles.countText}>активно</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('SurveyDetailPage')}
        >
          <View style={styles.cardTop}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>🗳️</Text>
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Оплата труда</Text>
              </View>

              <Text style={styles.timerText}>⏳ 4 дня осталось</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>
            Поддерживаете ли вы проект “Отраслевого соглашения” по условиям
            труда на 2024 год?
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>5</Text>
              <Text style={styles.metaLabel}>вопросов</Text>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>Активен</Text>
              <Text style={styles.metaLabel}>статус</Text>
            </View>
          </View>

          <View style={styles.button}>
            <Text style={styles.buttonText}>Пройти опрос</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.background || '#F5F7FA',
  },

  content: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 100,
    gap: 16,
  },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#002F42',
  },

  pageSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#7A8494',
    fontWeight: '500',
  },

  countBadge: {
    minWidth: 58,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  countValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0057B8',
    lineHeight: 20,
  },

  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  icon: {
    fontSize: 26,
  },

  cardInfo: {
    flex: 1,
    gap: 6,
  },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  badgeText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '800',
  },

  timerText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 23,
    color: '#111827',
  },

  metaRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },

  metaItem: {
    flex: 1,
    alignItems: 'center',
  },

  metaValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#002F42',
  },

  metaLabel: {
    marginTop: 2,
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },

  metaDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },

  button: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0057B8',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: -1,
  },
});