import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors } from '@shared/theme/colors';
import { DefaultLayout } from '@widgets/Layout/DefaultLayout';

import { SharedLoader } from '@shared/ui/SharedLoader/SharedLoader';

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

type RequestStatus = 'pending' | 'resolved';

type RequestType =
  | 'violation'
  | 'work'
  | 'salary'
  | 'social'
  | 'collective';

interface RequestItem {
  id: string;
  tag: string;
  date: string;
  problem: string;
  solution: string;
  comment?: string;
  status: RequestStatus;
  likes: number;
  dislikes: number;
  userVote: 'like' | 'dislike' | null;
}

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
      date:
        item.created_at ||
        item.updated_at ||
        item.date ||
        '',
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
            {requests.map(item => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarEmoji}>👤</Text>
                    </View>

                    <View>
                      <Text style={styles.userNameText}>Аноним</Text>
                      <Text style={styles.dateText}>{item.date}</Text>
                    </View>
                  </View>

                  <View style={styles.tagLabel}>
                    <Text style={styles.tagLabelText}>{item.tag}</Text>
                  </View>
                </View>

                <View style={styles.bodyBlock}>
                  <Text style={styles.problemTitle}>{item.problem}</Text>

                  <Text style={styles.bodyLabel}>
                    Вариант решения проблемы:
                  </Text>

                  <Text style={styles.solutionText}>{item.solution}</Text>
                </View>

                {activeSegment === 'resolved' && item.comment ? (
                  <View style={styles.commentBlock}>
                    <Text style={styles.commentText}>{item.comment}</Text>
                  </View>
                ) : null}

                <View style={styles.divider} />

                <View style={styles.interactionsBar}>
                  <TouchableOpacity
                    style={styles.voteNode}
                    activeOpacity={0.6}
                    onPress={() => handleVote(item.id, 'like')}
                  >
                    <Text
                      style={[
                        styles.voteIcon,
                        item.userVote === 'like' && styles.activeLikeText,
                      ]}
                    >
                      {item.userVote === 'like' ? '❤️' : '🤍'}
                    </Text>

                    <Text
                      style={[
                        styles.voteCount,
                        item.userVote === 'like' && styles.activeLikeText,
                      ]}
                    >
                      {item.likes}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.voteNode}
                    activeOpacity={0.6}
                    onPress={() => handleVote(item.id, 'dislike')}
                  >
                    <Text
                      style={[
                        styles.voteIcon,
                        item.userVote === 'dislike' &&
                          styles.activeDislikeText,
                      ]}
                    >
                      💔
                    </Text>

                    <Text
                      style={[
                        styles.voteCount,
                        item.userVote === 'dislike' &&
                          styles.activeDislikeText,
                      ]}
                    >
                      {item.dislikes}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {requests.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Text style={styles.emptyIcon}>📭</Text>
                </View>

                <Text style={styles.emptyTitle}>Заявок пока нет</Text>

                <Text style={styles.emptyDescription}>
                  В этом разделе пока нет заявок. Когда они появятся, вы увидите их здесь.
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 16,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
  },
  dateText: {
    fontSize: 13,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  tagLabel: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 140,
  },
  tagLabelText: {
    fontSize: 11,
    color: '#2B6CB0',
    fontWeight: '700',
  },
  bodyBlock: {
    gap: 8,
  },
  problemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    lineHeight: 22,
  },
  bodyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3748',
    marginTop: 4,
  },
  solutionText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    fontWeight: '400',
  },
  commentBlock: {
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderColor: '#3182CE',
    marginTop: 10,
  },
  commentText: {
    fontSize: 13,
    color: '#4A5568',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF2F7',
    marginVertical: 14,
  },
  interactionsBar: {
    flexDirection: 'row',
    gap: 20,
  },
  voteNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voteIcon: {
    fontSize: 16,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  activeLikeText: {
    color: '#E53E3E',
    fontWeight: '700',
  },
  activeDislikeText: {
    color: '#4A5568',
    fontWeight: '700',
  },
  loader: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#A0AEC0',
    marginTop: 30,
    fontSize: 14,
    fontWeight: '500',
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