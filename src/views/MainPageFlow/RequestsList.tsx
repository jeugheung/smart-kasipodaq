import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

import { colors } from '@shared/theme/colors';
import { DefaultLayout } from '@widgets/Layout/DefaultLayout';
import { SharedLoader } from '@shared/ui/SharedLoader/SharedLoader';

import {
  RequestItem,
  RequestStatus,
  PendingRequestCard,
  ResolvedRequestCard,
} from '@entities/RequestCard';

import {
  getViolationApproved,
  getViolationFinished,
  getWorkApproved,
  getWorkFinished,
  getSalaryApproved,
  getSalaryFinished,
  getSocialApproved,
  getSocialFinished,
  getCollectiveApproved,
  getCollectiveFinished,
} from '@shared/api/endpoints';

type RequestType =
  | 'violation'
  | 'work'
  | 'salary'
  | 'social'
  | 'collective';

const TITLE_MAP: Record<RequestType, string> = {
  violation: 'Нарушение ТК',
  work: 'Условия труда',
  salary: 'Оплата труда',
  social: 'Социальные льготы',
  collective: 'Предложения по коллективному договору',
};

const apiMap: Record<
  RequestType,
  {
    pending: () => Promise<any[]>;
    resolved: () => Promise<any[]>;
  }
> = {
  violation: {
    pending: getViolationApproved,
    resolved: getViolationFinished,
  },
  work: {
    pending: getWorkApproved,
    resolved: getWorkFinished,
  },
  salary: {
    pending: getSalaryApproved,
    resolved: getSalaryFinished,
  },
  social: {
    pending: getSocialApproved,
    resolved: getSocialFinished,
  },
  collective: {
    pending: getCollectiveApproved,
    resolved: getCollectiveFinished,
  },
};

export const RequestsList = ({ route }: any) => {
  const { requestType } = route.params as { requestType: RequestType };

  const [activeSegment, setActiveSegment] = useState<RequestStatus>('pending');
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWithTimeout = async <T,>(
    promise: Promise<T>,
    timeoutMs = 10000
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs)
      ),
    ]);
  };

  const mapRequest = (
    item: any,
    segment: RequestStatus,
    fallbackType: RequestType
  ): RequestItem => {
    const typeKey = (item.type_name || fallbackType) as RequestType;
    const tag = TITLE_MAP[typeKey] || TITLE_MAP[fallbackType];

    return {
      id: item.id?.toString() ?? Math.random().toString(),
      tag,
      date: item.created_at || item.updated_at || item.date || '',
      problem: item.problem || item.title || 'Без названия',
      solution: item.solution || item.description || '',
      comment: item.comment || '',
      status: segment,
      likes: Number(item.solution_likes || item.likes || 0),
      dislikes: Number(item.solution_dislikes || item.dislikes || 0),
      userVote: null,
    };
  };

  const loadRequests = useCallback(
    async (segment: RequestStatus) => {
      setLoading(true);

      try {
        const fetcher = apiMap[requestType][segment];
        const data = await fetchWithTimeout(fetcher(), 10000);

        const mapped = data.map(item =>
          mapRequest(item, segment, requestType)
        );

        setRequests(mapped);
      } catch (e: any) {
        console.error(e);

        if (e.message === 'timeout') {
          Alert.alert(
            'Ошибка сети',
            'Сервер слишком долго отвечает. Попробуйте позже.'
          );
        } else {
          Alert.alert('Ошибка', 'Не удалось загрузить данные');
        }

        setRequests([]);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    },
    [requestType]
  );

  useEffect(() => {
    loadRequests(activeSegment);
  }, [activeSegment, loadRequests]);

  const handleVote = (id: string, type: 'like' | 'dislike') => {
    setRequests(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        let newLikes = item.likes;
        let newDislikes = item.dislikes;
        let newVote = item.userVote;

        if (item.userVote === type) {
          newVote = null;

          if (type === 'like') {
            newLikes--;
          } else {
            newDislikes--;
          }
        } else {
          if (item.userVote === 'like') newLikes--;
          if (item.userVote === 'dislike') newDislikes--;

          newVote = type;

          if (type === 'like') {
            newLikes++;
          } else {
            newDislikes++;
          }
        }

        return {
          ...item,
          likes: newLikes,
          dislikes: newDislikes,
          userVote: newVote,
        };
      })
    );
  };

  return (
    <DefaultLayout variant="back" title={TITLE_MAP[requestType]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeSegment === 'pending' && styles.segmentButtonActive,
            ]}
            onPress={() => setActiveSegment('pending')}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'pending' && styles.segmentTextActive,
              ]}
            >
              На рассмотрении
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeSegment === 'resolved' && styles.segmentButtonActive,
            ]}
            onPress={() => setActiveSegment('resolved')}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'resolved' && styles.segmentTextActive,
              ]}
            >
              Решённые вопросы
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <SharedLoader visible={loading} />
          </View>
        ) : (
          <View style={styles.listContainer}>
            {requests.map(item =>
              item.status === 'pending' ? (
                <PendingRequestCard
                  key={item.id}
                  item={item}
                  requestType={item.tag}
                  onVote={handleVote}
                />
              ) : item.status === 'resolved' ? (
                <ResolvedRequestCard
                  key={item.id}
                  item={item}
                  requestType={item.tag}
                  onVote={handleVote}
                />
              ) : null
            )}

            {requests.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Text style={styles.emptyIcon}>📭</Text>
                </View>

                <Text style={styles.emptyTitle}>Заявок пока нет</Text>

                <Text style={styles.emptyDescription}>
                  В этом разделе пока нет заявок. Когда они появятся, вы
                  увидите их здесь.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },

  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },

  segmentButtonActive: {
    backgroundColor: '#003366',
  },

  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },

  segmentTextActive: {
    color: '#FFFFFF',
  },

  listContainer: {
    gap: 14,
  },

  loader: {
    paddingVertical: 30,
    alignItems: 'center',
  },

  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 34,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyIcon: {
    fontSize: 30,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 8,
  },

  emptyDescription: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 19,
  },
});