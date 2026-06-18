import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { SectionHeader } from '../../shared/ui/SectionHeader';
import { colors } from '../../shared/theme/colors';

import ArrowIcon from '../../../assets/profile-icons/right-arrow.svg';

import ViolationIcon from '../../../assets/main-icons/violation.svg';
import WorkIcon from '../../../assets/main-icons/work.svg';
import SalaryIcon from '../../../assets/main-icons/salary.svg';
import SocialIcon from '../../../assets/main-icons/social.svg';
import CollectiveIcon from '../../../assets/main-icons/collective.svg';

import {
  getViolationSolutions,
  getWorkSolutions,
  getSalarySolutions,
  getSocialSolutions,
  getCollectiveSolutions,
} from '../../../src/shared/api/endpoints';

import { RequestTabSkeleton } from '@shared/ui/RequestTabSkeleton';

type RequestType =
  | 'violation'
  | 'work'
  | 'salary'
  | 'social'
  | 'collective';

type CardItem = {
  id: string;
  title: string;
  description: string;
  icon: React.FC<{ width?: number; height?: number }>;
};

const TABS: { key: RequestType; title: string }[] = [
  { key: 'violation', title: 'Нарушение ТК' },
  { key: 'work', title: 'Условия труда' },
  { key: 'salary', title: 'Оплата труда' },
  { key: 'social', title: 'Социальные льготы' },
  { key: 'collective', title: 'Предложения по коллективному договору' },
];

const ICONS = {
  violation: ViolationIcon,
  work: WorkIcon,
  salary: SalaryIcon,
  social: SocialIcon,
  collective: CollectiveIcon,
};

const TAB_COLORS: Record<RequestType, string> = {
  violation: '#C9F2FF',
  work: '#FFF1B7',
  salary: '#FFE9B1',
  social: '#F4FFB5',
  collective: '#E8DDFF',
};

const API_CALLS: Record<RequestType, () => Promise<any[]>> = {
  violation: getViolationSolutions,
  work: getWorkSolutions,
  salary: getSalarySolutions,
  social: getSocialSolutions,
  collective: getCollectiveSolutions,
};

export const RequestsTabWidget = () => {
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<RequestType>('violation');

  const [data, setData] = useState<Record<RequestType, CardItem[]>>({
    violation: [],
    work: [],
    salary: [],
    social: [],
    collective: [],
  });

  const [loading, setLoading] = useState<Record<RequestType, boolean>>({
    violation: true,
    work: false,
    salary: false,
    social: false,
    collective: false,
  });

  const mapResponse = (resp: any[], tab: RequestType): CardItem[] => {
    return resp.map((item: any, index: number) => ({
      id: item.id?.toString() ?? `${tab}-${index}`,
      title:
        item.title_ru ||
        item.title ||
        item.problem ||
        item.name_ru ||
        item.name ||
        'Без названия',
      description:
        item.full_text_ru ||
        item.description_ru ||
        item.description ||
        item.solution ||
        item.text_ru ||
        item.text ||
        '',
      icon: ICONS[tab],
    }));
  };

  const loadTabData = (tab: RequestType) => {
    if (data[tab].length > 0) return;

    setLoading(prev => ({ ...prev, [tab]: true }));

    API_CALLS[tab]()
      .then(resp => {
        setData(prev => ({
          ...prev,
          [tab]: mapResponse(resp, tab),
        }));
      })
      .catch(console.error)
      .finally(() => {
        setLoading(prev => ({ ...prev, [tab]: false }));
      });
  };

  useEffect(() => {
    loadTabData('violation');
  }, []);

  const handleTabPress = (tab: RequestType) => {
    setActiveTab(tab);
    loadTabData(tab);
  };

  const currentData = data[activeTab];
  const currentTitle =
    TABS.find(tab => tab.key === activeTab)?.title ?? '';

  return (
    <View style={styles.container}>
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
              onPress={() => handleTabPress(item.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === item.key && styles.activeTabText,
                ]}
              >
                {item.title}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <SectionHeader
        title={currentTitle}
        onPressAction={() =>
          navigation.navigate('RequestsList', {
            requestType: activeTab,
          })
        }
      />

      <ScrollView style={styles.cardsContainer} scrollEnabled={false}>
        {loading[activeTab] ? (
          <RequestTabSkeleton />
        ) : currentData.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={{ fontSize: 32 }}>📄</Text>
            </View>

            <Text style={styles.emptyTitle}>
              Пока нет данных
            </Text>

            <Text style={styles.emptyDescription}>
              В данном разделе пока отсутствуют обращения или публикации.
            </Text>
          </View>
        ) : (
          currentData.map(card => {
            const Icon = card.icon;

            return (
              <Pressable
                key={card.id}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
                onPress={() =>
                  navigation.navigate('RequestsList', {
                    requestType: activeTab,
                  })
                }
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: TAB_COLORS[activeTab] },
                  ]}
                >
                  <Icon width={22} height={22} />
                </View>

                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {card.title}
                  </Text>

                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {card.description}
                  </Text>
                </View>

                <ArrowIcon width={14} height={14} />
              </Pressable>
            );
          })
        )}
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
    marginBottom: 15,
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
    backgroundColor: 'rgb(211, 215, 221)',
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
    shadowColor: '#000',
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
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  emptyIcon: {
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002F42',
    marginBottom: 8,
  },

  emptyDescription: {
    fontSize: 13,
    color: '#878787',
    textAlign: 'center',
    lineHeight: 18,
  },
});