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

import ViolationIcon from '../../../assets/stat-icons/violation.svg';
import WorkIcon from '../../../assets/stat-icons/work.svg';
import SalaryIcon from '../../../assets/stat-icons/salary.svg';
import SocialIcon from '../../../assets/stat-icons/social.svg';
import CollectiveIcon from '../../../assets/stat-icons/collective.svg';

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
};

const TABS: { key: RequestType; title: string }[] = [
  { key: 'violation', title: 'Нарушение ТК' },
  { key: 'work', title: 'Условия труда' },
  { key: 'salary', title: 'Оплата труда' },
  { key: 'social', title: 'Социальные льготы' },
  { key: 'collective', title: 'Предложения по коллективному договору' },
];

const TAB_ICONS: Record<RequestType, React.FC<any>> = {
  violation: ViolationIcon,
  work: WorkIcon,
  salary: SalaryIcon,
  social: SocialIcon,
  collective: CollectiveIcon,
};

const TAB_COLORS: Record<RequestType, string> = {
  violation: '#EAF3FF',
  work: '#EAF3FF',
  salary: '#EAF3FF',
  social: '#EAF3FF',
  collective: '#EAF3FF',
};

const TAB_ACCENT_COLORS: Record<RequestType, string> = {
  violation: '#2563EB',
  work: '#2563EB',
  salary: '#2563EB',
  social: '#2563EB',
  collective: '#2563EB',
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
    }));
  };

  const loadTabData = (tab: RequestType) => {
    setLoading(prev => ({ ...prev, [tab]: true }));

    API_CALLS[tab]()
      .then(resp => {
        setData(prev => ({
          ...prev,
          [tab]: mapResponse(resp, tab),
        }));
      })
      .catch(error => {
        console.error(error);

        setData(prev => ({
          ...prev,
          [tab]: [],
        }));
      })
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
  const currentTitle = TABS.find(tab => tab.key === activeTab)?.title ?? '';
  const ActiveIcon = TAB_ICONS[activeTab];

  return (
    <View style={styles.container}>
      <View style={styles.tabsWrapper}>
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item }) => {
            const isActive = activeTab === item.key;

            return (
              <Pressable
                style={[
                  styles.tabButton,
                  isActive && {
                    backgroundColor: TAB_ACCENT_COLORS[item.key],
                  },
                ]}
                onPress={() => handleTabPress(item.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive && styles.activeTabText,
                  ]}
                >
                  {item.title}
                </Text>
              </Pressable>
            );
          }}
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
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: TAB_COLORS[activeTab] },
              ]}
            >
              <ActiveIcon width={30} height={30} />
            </View>

            <Text style={styles.emptyTitle}>Пока нет данных</Text>

            <Text style={styles.emptyDescription}>
              В данном разделе пока отсутствуют обращения или публикации.
            </Text>
          </View>
        ) : (
          currentData.map(card => {
            const Icon = TAB_ICONS[activeTab];

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
                  <Icon width={24} height={24} />
                </View>

                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {card.title}
                  </Text>

                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {card.description}
                  </Text>
                </View>

                <View
                  style={[
                    styles.arrowCircle,
                    { backgroundColor: TAB_COLORS[activeTab] },
                  ]}
                >
                  <Text
                    style={[
                      styles.arrow,
                      { color: TAB_ACCENT_COLORS[activeTab] },
                    ]}
                  >
                    ›
                  </Text>
                </View>
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
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: '#EEF2F7',
  },

  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },

  activeTabText: {
    color: '#FFFFFF',
  },

  cardsContainer: {
    marginTop: 10,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 92,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },

  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
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
    fontWeight: '800',
    fontSize: 14,
    color: '#0F172A',
  },

  cardDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    fontWeight: '500',
  },

  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrow: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: -2,
  },

  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 38,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  emptyIconCircle: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },

  emptyDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
});