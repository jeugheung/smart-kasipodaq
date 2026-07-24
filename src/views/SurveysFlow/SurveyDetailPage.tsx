import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@shared/theme/colors';
import { DefaultLayout } from '@widgets/Layout/DefaultLayout';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const ANKETA_VIEW_API =
  'https://kasipodaq.competence.kz/api/anketa-view';

const ANKETA_SUBMIT_API =
  'https://kasipodaq.competence.kz/api/anketa-submit';

interface AnketaOption {
  id: number;
  option_text: string;
}

interface AnketaQuestion {
  id: number;
  question_text: string;
  options: AnketaOption[];
}

interface AnketaDetail {
  id: number;
  title: string;
  description: string | null;
  questions: AnketaQuestion[];
}

interface AnketaViewResponse {
  msg: string;
  result: number;
  anketa?: AnketaDetail;
}

interface AnketaSubmitResponse {
  msg: string;
  result: number;
}

interface SelectedAnswers {
  [questionId: number]: number;
}

type ResultModalType =
  | 'success'
  | 'error'
  | 'warning'
  | 'auth';

interface ResultModalState {
  visible: boolean;
  type: ResultModalType;
  title: string;
  message: string;
}

const initialModalState: ResultModalState = {
  visible: false,
  type: 'error',
  title: '',
  message: '',
};

export const SurveyDetailPage = ({
  navigation,
  route,
}: any) => {
  const anketaId = Number(route?.params?.anketaId);

  const [anketa, setAnketa] = useState<AnketaDetail | null>(null);
  const [selectedAnswers, setSelectedAnswers] =
    useState<SelectedAnswers>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [resultModal, setResultModal] =
    useState<ResultModalState>(initialModalState);

  const showModal = (
    type: ResultModalType,
    title: string,
    message: string
  ) => {
    setResultModal({
      visible: true,
      type,
      title,
      message,
    });
  };

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Произошла неизвестная ошибка';
  };

  const handleUnauthorized = async () => {
    await AsyncStorage.removeItem('access_token');

    showModal(
      'auth',
      'Сессия завершена',
      'Срок действия авторизации истёк. Войдите в аккаунт повторно.'
    );
  };

  const fetchAnketa = useCallback(
    async (refresh = false) => {
      if (!anketaId || Number.isNaN(anketaId)) {
        setIsLoading(false);

        showModal(
          'error',
          'Ошибка перехода',
          'Не удалось определить идентификатор анкеты.'
        );

        return;
      }

      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const accessToken = await AsyncStorage.getItem('access_token');

        if (!accessToken) {
          showModal(
            'auth',
            'Требуется авторизация',
            'Для прохождения анкеты необходимо войти в аккаунт.'
          );

          return;
        }

        const response = await fetch(
          `${ANKETA_VIEW_API}?id=${encodeURIComponent(anketaId)}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        let data: AnketaViewResponse | null = null;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (response.status === 401 || response.status === 403) {
          await handleUnauthorized();
          return;
        }

        if (response.status === 404) {
          throw new Error('Анкета не найдена или была удалена');
        }

        if (!response.ok) {
          throw new Error(
            data?.msg ||
              `Не удалось получить анкету. Код ошибки: ${response.status}`
          );
        }

        if (!data || data.result !== 1 || !data.anketa) {
          throw new Error(data?.msg || 'Сервер не вернул данные анкеты');
        }

        const normalizedAnketa: AnketaDetail = {
          ...data.anketa,
          questions: Array.isArray(data.anketa.questions)
            ? data.anketa.questions.map(question => ({
                ...question,
                options: Array.isArray(question.options)
                  ? question.options
                  : [],
              }))
            : [],
        };

        setAnketa(normalizedAnketa);
        setSelectedAnswers({});
      } catch (error) {
        showModal(
          'error',
          'Ошибка загрузки',
          getErrorMessage(error) ||
            'Не удалось загрузить анкету. Проверьте интернет-соединение.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [anketaId]
  );

  useEffect(() => {
    fetchAnketa();
  }, [fetchAnketa]);

  const questions = anketa?.questions ?? [];

  const answeredCount = useMemo(() => {
    return questions.filter(
      question => selectedAnswers[question.id] !== undefined
    ).length;
  }, [questions, selectedAnswers]);

  const totalCount = questions.length;

  const canSubmit =
    totalCount > 0 &&
    answeredCount === totalCount &&
    !isSubmitting;

  const handleSelectOption = (
    questionId: number,
    optionId: number
  ) => {
    if (isSubmitting) {
      return;
    }

    setSelectedAnswers(previousAnswers => ({
      ...previousAnswers,
      [questionId]: optionId,
    }));
  };

  const validateAnswers = () => {
    if (!anketa) {
      showModal(
        'error',
        'Анкета не загружена',
        'Обновите страницу и попробуйте снова.'
      );

      return false;
    }

    if (anketa.questions.length === 0) {
      showModal(
        'warning',
        'Нет вопросов',
        'В этой анкете пока нет вопросов для заполнения.'
      );

      return false;
    }

    const unansweredQuestion = anketa.questions.find(
      question => selectedAnswers[question.id] === undefined
    );

    if (unansweredQuestion) {
      const questionIndex = anketa.questions.findIndex(
        question => question.id === unansweredQuestion.id
      );

      showModal(
        'warning',
        'Ответьте на все вопросы',
        `Не выбран ответ на вопрос №${questionIndex + 1}.`
      );

      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateAnswers() || !anketa || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const accessToken = await AsyncStorage.getItem('access_token');

      if (!accessToken) {
        showModal(
          'auth',
          'Требуется авторизация',
          'Для отправки ответов необходимо войти в аккаунт.'
        );

        return;
      }

      const requestBody = {
        anketa_id: anketa.id,
        answers: anketa.questions.map(question => ({
          question_id: question.id,
          option_id: selectedAnswers[question.id],
        })),
      };

      const response = await fetch(ANKETA_SUBMIT_API, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      let data: AnketaSubmitResponse | null = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.status === 401 || response.status === 403) {
        await handleUnauthorized();
        return;
      }

      /*
       * Обычно сервер возвращает 409 или 422,
       * когда анкета уже была отправлена
       * либо данные не прошли проверку.
       */
      if (response.status === 409) {
        showModal(
          'warning',
          'Анкета уже пройдена',
          data?.msg ||
            'Ответы на эту анкету уже были отправлены ранее.'
        );

        return;
      }

      if (response.status === 422) {
        showModal(
          'error',
          'Некорректные ответы',
          data?.msg ||
            'Сервер не принял ответы. Проверьте заполнение анкеты.'
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.msg ||
            `Не удалось отправить ответы. Код ошибки: ${response.status}`
        );
      }

      if (!data || data.result !== 1) {
        throw new Error(
          data?.msg || 'Сервер не подтвердил сохранение ответов'
        );
      }

      showModal(
        'success',
        'Анкета пройдена',
        'Спасибо! Ваши ответы успешно сохранены.'
      );
    } catch (error) {
      showModal(
        'error',
        'Ошибка отправки',
        getErrorMessage(error) ||
          'Не удалось отправить ответы. Попробуйте ещё раз.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeResultModal = () => {
    const modalType = resultModal.type;

    setResultModal(initialModalState);

    if (modalType === 'success') {
      navigation.goBack();
      return;
    }

    if (modalType === 'auth') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginPage' }],
      });
    }
  };

  const getModalIcon = () => {
    switch (resultModal.type) {
      case 'success':
        return '✅';

      case 'warning':
        return '⚠️';

      case 'auth':
        return '🔐';

      default:
        return '❌';
    }
  };

  const getModalButtonText = () => {
    switch (resultModal.type) {
      case 'success':
        return 'Готово';

      case 'auth':
        return 'Перейти ко входу';

      default:
        return 'Понятно';
    }
  };

  const getModalIconStyle = () => {
    switch (resultModal.type) {
      case 'success':
        return styles.modalIconSuccess;

      case 'warning':
        return styles.modalIconWarning;

      case 'auth':
        return styles.modalIconAuth;

      default:
        return styles.modalIconError;
    }
  };

  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#0057B8" />

      <Text style={styles.loadingText}>
        Загружаем вопросы анкеты...
      </Text>
    </View>
  );

  const renderEmptyQuestions = () => (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconCircle}>
        <Text style={styles.emptyIcon}>📋</Text>
      </View>

      <Text style={styles.emptyTitle}>
        В анкете нет вопросов
      </Text>

      <Text style={styles.emptyDescription}>
        Вопросы пока не добавлены. Вернитесь позже или обновите страницу.
      </Text>

      <TouchableOpacity
        style={styles.retryButton}
        activeOpacity={0.8}
        onPress={() => fetchAnketa()}
      >
        <Text style={styles.retryButtonText}>Обновить</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <DefaultLayout
      variant="back"
      title="Анкета"
      onRightPress={() => alert('EN')}
    >
      <View style={styles.screen}>
        {isLoading ? (
          renderLoading()
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => fetchAnketa(true)}
                tintColor="#0057B8"
                colors={['#0057B8']}
              />
            }
          >
            {anketa && (
              <>
                <View style={styles.pageHeader}>
                  <View style={styles.pageHeaderText}>
                    <Text style={styles.pageTitle}>
                      Анкетирование
                    </Text>

                    <Text style={styles.pageSubtitle}>
                      Выберите один вариант ответа в каждом вопросе
                    </Text>
                  </View>

                  <View style={styles.progressBadge}>
                    <Text style={styles.progressValue}>
                      {answeredCount}/{totalCount}
                    </Text>

                    <Text style={styles.progressLabel}>
                      ответов
                    </Text>
                  </View>
                </View>

                <View style={styles.surveyHeader}>
                  <Text style={styles.surveyTitle}>
                    {anketa.title}
                  </Text>

                  {!!anketa.description && (
                    <Text style={styles.surveyDescription}>
                      {anketa.description}
                    </Text>
                  )}
                </View>

                {questions.length === 0
                  ? renderEmptyQuestions()
                  : questions.map((question, questionIndex) => (
                      <View
                        key={question.id}
                        style={styles.card}
                      >
                        <View style={styles.questionHeader}>
                          <View style={styles.questionNumber}>
                            <Text style={styles.questionNumberText}>
                              {questionIndex + 1}
                            </Text>
                          </View>

                          <Text style={styles.cardTitle}>
                            {question.question_text}
                          </Text>
                        </View>

                        {question.options.length === 0 ? (
                          <View style={styles.noOptionsContainer}>
                            <Text style={styles.noOptionsText}>
                              Для этого вопроса не добавлены варианты ответа.
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.optionsList}>
                            {question.options.map(option => {
                              const isSelected =
                                selectedAnswers[question.id] ===
                                option.id;

                              return (
                                <TouchableOpacity
                                  key={option.id}
                                  style={[
                                    styles.optionRow,
                                    isSelected &&
                                      styles.optionRowSelected,
                                  ]}
                                  activeOpacity={0.75}
                                  disabled={isSubmitting}
                                  onPress={() =>
                                    handleSelectOption(
                                      question.id,
                                      option.id
                                    )
                                  }
                                >
                                  <View
                                    style={[
                                      styles.checkbox,
                                      isSelected &&
                                        styles.checkboxSelected,
                                    ]}
                                  >
                                    {isSelected && (
                                      <View
                                        style={styles.checkboxDot}
                                      />
                                    )}
                                  </View>

                                  <Text
                                    style={[
                                      styles.optionText,
                                      isSelected &&
                                        styles.optionTextSelected,
                                    ]}
                                  >
                                    {option.option_text}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    ))}

                {questions.length > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      !canSubmit &&
                        styles.submitButtonDisabled,
                    ]}
                    activeOpacity={0.8}
                    disabled={!canSubmit}
                    onPress={handleSubmit}
                  >
                    {isSubmitting ? (
                      <View style={styles.submitLoadingRow}>
                        <ActivityIndicator
                          size="small"
                          color="#FFFFFF"
                        />

                        <Text style={styles.submitButtonText}>
                          Отправляем ответы...
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.submitButtonText,
                          !canSubmit &&
                            styles.submitButtonTextDisabled,
                        ]}
                      >
                        {canSubmit
                          ? 'Отправить ответы'
                          : `Ответьте на все вопросы (${answeredCount}/${totalCount})`}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        )}

        <Modal
          visible={resultModal.visible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={closeResultModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View
                style={[
                  styles.modalIconCircle,
                  getModalIconStyle(),
                ]}
              >
                <Text style={styles.modalIcon}>
                  {getModalIcon()}
                </Text>
              </View>

              <Text style={styles.modalTitle}>
                {resultModal.title}
              </Text>

              <Text style={styles.modalDescription}>
                {resultModal.message}
              </Text>

              <TouchableOpacity
                style={styles.modalButton}
                activeOpacity={0.8}
                onPress={closeResultModal}
              >
                <Text style={styles.modalButtonText}>
                  {getModalButtonText()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background || '#F5F7FA',
  },

  scrollView: {
    flex: 1,
    backgroundColor: colors.background || '#F5F7FA',
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 16,
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 14,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },

  pageHeaderText: {
    flex: 1,
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
    lineHeight: 18,
  },

  progressBadge: {
    minWidth: 68,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  progressValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0057B8',
    lineHeight: 20,
  },

  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },

  surveyHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  surveyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#002F42',
    lineHeight: 25,
  },

  surveyDescription: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  questionNumberText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0057B8',
  },

  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 23,
    color: '#111827',
  },

  optionsList: {
    gap: 10,
  },

  optionRow: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },

  optionRowSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#0057B8',
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  checkboxSelected: {
    borderColor: '#0057B8',
  },

  checkboxDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0057B8',
  },

  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    color: '#334155',
  },

  optionTextSelected: {
    color: '#002F42',
  },

  noOptionsContainer: {
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 14,
  },

  noOptionsText: {
    color: '#C2410C',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },

  submitButton: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: '#0057B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  submitButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },

  submitButtonTextDisabled: {
    color: '#94A3B8',
  },

  submitLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyIcon: {
    fontSize: 34,
  },

  emptyTitle: {
    color: '#002F42',
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyDescription: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
    textAlign: 'center',
  },

  retryButton: {
    height: 46,
    minWidth: 140,
    borderRadius: 23,
    backgroundColor: '#0057B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    paddingHorizontal: 24,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },

  modalIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  modalIconSuccess: {
    backgroundColor: '#DCFCE7',
  },

  modalIconWarning: {
    backgroundColor: '#FEF3C7',
  },

  modalIconError: {
    backgroundColor: '#FEE2E2',
  },

  modalIconAuth: {
    backgroundColor: '#DBEAFE',
  },

  modalIcon: {
    fontSize: 34,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#002F42',
    marginBottom: 8,
    textAlign: 'center',
  },

  modalDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },

  modalButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0057B8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
