import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ANKETA_VIEW_API =
  "https://kasipodaq.competence.kz/api/anketa-view";

const ANKETA_SUBMIT_API =
  "https://kasipodaq.competence.kz/api/anketa-submit";

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
  | "success"
  | "error"
  | "warning"
  | "auth";

interface ResultModalState {
  visible: boolean;
  type: ResultModalType;
  title: string;
  message: string;
}

const initialModalState: ResultModalState = {
  visible: false,
  type: "error",
  title: "",
  message: "",
};

export const SurveyDetailPage = ({
  navigation,
  route,
}: any) => {
  const anketaId = Number(route?.params?.anketaId);

  const [anketa, setAnketa] =
    useState<AnketaDetail | null>(null);

  const [selectedAnswers, setSelectedAnswers] =
    useState<SelectedAnswers>({});

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [resultModal, setResultModal] =
    useState<ResultModalState>(
      initialModalState,
    );

  const showModal = useCallback(
    (
      type: ResultModalType,
      title: string,
      message: string,
    ) => {
      setResultModal({
        visible: true,
        type,
        title,
        message,
      });
    },
    [],
  );

  const getErrorMessage = useCallback(
    (error: unknown) => {
      if (error instanceof Error) {
        return error.message;
      }

      return "Произошла неизвестная ошибка";
    },
    [],
  );

  const handleUnauthorized =
    useCallback(async () => {
      await AsyncStorage.removeItem(
        "access_token",
      );

      showModal(
        "auth",
        "Сессия завершена",
        "Срок действия авторизации истёк. Войдите в аккаунт повторно.",
      );
    }, [showModal]);

  const fetchAnketa = useCallback(
    async (refresh = false) => {
      if (
        !anketaId ||
        Number.isNaN(anketaId)
      ) {
        setIsLoading(false);

        showModal(
          "error",
          "Ошибка перехода",
          "Не удалось определить идентификатор анкеты.",
        );

        return;
      }

      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const accessToken =
          await AsyncStorage.getItem(
            "access_token",
          );

        if (!accessToken) {
          showModal(
            "auth",
            "Требуется авторизация",
            "Для прохождения анкеты необходимо войти в аккаунт.",
          );

          return;
        }

        const response = await fetch(
          `${ANKETA_VIEW_API}?id=${encodeURIComponent(anketaId)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        let data: AnketaViewResponse | null =
          null;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          await handleUnauthorized();
          return;
        }

        if (response.status === 404) {
          throw new Error(
            "Анкета не найдена или была удалена",
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.msg ||
              `Не удалось получить анкету. Код ошибки: ${response.status}`,
          );
        }

        if (
          !data ||
          data.result !== 1 ||
          !data.anketa
        ) {
          throw new Error(
            data?.msg ||
              "Сервер не вернул данные анкеты",
          );
        }

        const normalizedAnketa: AnketaDetail =
          {
            ...data.anketa,
            questions: Array.isArray(
              data.anketa.questions,
            )
              ? data.anketa.questions.map(
                  (question) => ({
                    ...question,
                    options: Array.isArray(
                      question.options,
                    )
                      ? question.options
                      : [],
                  }),
                )
              : [],
          };

        setAnketa(normalizedAnketa);
        setSelectedAnswers({});
      } catch (error) {
        showModal(
          "error",
          "Ошибка загрузки",
          getErrorMessage(error) ||
            "Не удалось загрузить анкету. Проверьте интернет-соединение.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      anketaId,
      getErrorMessage,
      handleUnauthorized,
      showModal,
    ],
  );

  useEffect(() => {
    fetchAnketa();
  }, [fetchAnketa]);

  const questions =
    anketa?.questions ?? [];

  const answeredCount = useMemo(
    () =>
      questions.filter(
        (question) =>
          selectedAnswers[question.id] !==
          undefined,
      ).length,
    [questions, selectedAnswers],
  );

  const totalCount = questions.length;

  const canSubmit =
    totalCount > 0 &&
    answeredCount === totalCount &&
    !isSubmitting;

  const handleSelectOption = (
    questionId: number,
    optionId: number,
  ) => {
    if (isSubmitting) {
      return;
    }

    setSelectedAnswers(
      (previousAnswers) => ({
        ...previousAnswers,
        [questionId]: optionId,
      }),
    );
  };

  const validateAnswers = () => {
    if (!anketa) {
      showModal(
        "error",
        "Анкета не загружена",
        "Обновите страницу и попробуйте снова.",
      );

      return false;
    }

    if (anketa.questions.length === 0) {
      showModal(
        "warning",
        "Нет вопросов",
        "В этой анкете пока нет вопросов для заполнения.",
      );

      return false;
    }

    const unansweredQuestion =
      anketa.questions.find(
        (question) =>
          selectedAnswers[question.id] ===
          undefined,
      );

    if (unansweredQuestion) {
      const questionIndex =
        anketa.questions.findIndex(
          (question) =>
            question.id ===
            unansweredQuestion.id,
        );

      showModal(
        "warning",
        "Ответьте на все вопросы",
        `Не выбран ответ на вопрос №${questionIndex + 1}.`,
      );

      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (
      !validateAnswers() ||
      !anketa ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      const accessToken =
        await AsyncStorage.getItem(
          "access_token",
        );

      if (!accessToken) {
        showModal(
          "auth",
          "Требуется авторизация",
          "Для отправки ответов необходимо войти в аккаунт.",
        );

        return;
      }

      const requestBody = {
        anketa_id: anketa.id,
        answers: anketa.questions.map(
          (question) => ({
            question_id: question.id,
            option_id:
              selectedAnswers[question.id],
          }),
        ),
      };

      const response = await fetch(
        ANKETA_SUBMIT_API,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      let data: AnketaSubmitResponse | null =
        null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        await handleUnauthorized();
        return;
      }

      if (response.status === 409) {
        showModal(
          "warning",
          "Анкета уже пройдена",
          data?.msg ||
            "Ответы на эту анкету уже были отправлены ранее.",
        );

        return;
      }

      if (response.status === 422) {
        showModal(
          "error",
          "Некорректные ответы",
          data?.msg ||
            "Сервер не принял ответы. Проверьте заполнение анкеты.",
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.msg ||
            `Не удалось отправить ответы. Код ошибки: ${response.status}`,
        );
      }

      if (!data || data.result !== 1) {
        throw new Error(
          data?.msg ||
            "Сервер не подтвердил сохранение ответов",
        );
      }

      showModal(
        "success",
        "Анкета пройдена",
        "Спасибо! Ваши ответы успешно сохранены.",
      );
    } catch (error) {
      showModal(
        "error",
        "Ошибка отправки",
        getErrorMessage(error) ||
          "Не удалось отправить ответы. Попробуйте ещё раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeResultModal = () => {
    const modalType = resultModal.type;

    setResultModal(initialModalState);

    if (modalType === "success") {
      navigation.goBack();
      return;
    }

    if (modalType === "auth") {
      navigation.reset({
        index: 0,
        routes: [{ name: "LoginPage" }],
      });
    }
  };

  const getModalIcon = () => {
    switch (resultModal.type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "auth":
        return "🔐";
      default:
        return "❌";
    }
  };

  const getModalButtonText = () => {
    switch (resultModal.type) {
      case "success":
        return "Готово";
      case "auth":
        return "Перейти ко входу";
      default:
        return "Понятно";
    }
  };

  const getModalIconStyle = () => {
    switch (resultModal.type) {
      case "success":
        return styles.modalIconSuccess;
      case "warning":
        return styles.modalIconWarning;
      case "auth":
        return styles.modalIconAuth;
      default:
        return styles.modalIconError;
    }
  };

  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator
        size="large"
        color={colors.accent}
      />

      <Text style={styles.loadingText}>
        Загружаем вопросы анкеты...
      </Text>
    </View>
  );

  const renderEmptyQuestions = () => (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconCircle}>
        <Text style={styles.emptyIcon}>
          📋
        </Text>
      </View>

      <Text style={styles.emptyTitle}>
        В анкете нет вопросов
      </Text>

      <Text style={styles.emptyDescription}>
        Вопросы пока не добавлены. Вернитесь
        позже или обновите страницу.
      </Text>

      <TouchableOpacity
        style={styles.retryButton}
        activeOpacity={0.8}
        onPress={() => fetchAnketa()}
      >
        <Text style={styles.retryButtonText}>
          Обновить
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <DefaultLayout
      variant="back"
      title="Анкета"
      onRightPress={() => alert("EN")}
    >
      <View style={styles.screen}>
        {isLoading ? (
          renderLoading()
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={
              styles.content
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() =>
                  fetchAnketa(true)
                }
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
          >
            {anketa && (
              <>
                <View
                  style={styles.pageHeader}
                >
                  <View
                    style={
                      styles.pageHeaderText
                    }
                  >
                    <Text
                      style={styles.pageTitle}
                    >
                      Анкетирование
                    </Text>

                    <Text
                      style={
                        styles.pageSubtitle
                      }
                    >
                      Выберите один вариант
                      ответа в каждом вопросе
                    </Text>
                  </View>

                  <View
                    style={
                      styles.progressBadge
                    }
                  >
                    <Text
                      style={
                        styles.progressValue
                      }
                    >
                      {answeredCount}/
                      {totalCount}
                    </Text>

                    <Text
                      style={
                        styles.progressLabel
                      }
                    >
                      ответов
                    </Text>
                  </View>
                </View>

                <View
                  style={styles.surveyHeader}
                >
                  <Text
                    style={styles.surveyTitle}
                  >
                    {anketa.title}
                  </Text>

                  {!!anketa.description && (
                    <Text
                      style={
                        styles.surveyDescription
                      }
                    >
                      {anketa.description}
                    </Text>
                  )}
                </View>

                {questions.length === 0
                  ? renderEmptyQuestions()
                  : questions.map(
                      (
                        question,
                        questionIndex,
                      ) => (
                        <View
                          key={question.id}
                          style={styles.card}
                        >
                          <View
                            style={
                              styles.questionHeader
                            }
                          >
                            <View
                              style={
                                styles.questionNumber
                              }
                            >
                              <Text
                                style={
                                  styles.questionNumberText
                                }
                              >
                                {questionIndex +
                                  1}
                              </Text>
                            </View>

                            <Text
                              style={
                                styles.cardTitle
                              }
                            >
                              {
                                question.question_text
                              }
                            </Text>
                          </View>

                          {question.options
                            .length === 0 ? (
                            <View
                              style={
                                styles.noOptionsContainer
                              }
                            >
                              <Text
                                style={
                                  styles.noOptionsText
                                }
                              >
                                Для этого
                                вопроса не
                                добавлены
                                варианты
                                ответа.
                              </Text>
                            </View>
                          ) : (
                            <View
                              style={
                                styles.optionsList
                              }
                            >
                              {question.options.map(
                                (option) => {
                                  const isSelected =
                                    selectedAnswers[
                                      question
                                        .id
                                    ] ===
                                    option.id;

                                  return (
                                    <TouchableOpacity
                                      key={
                                        option.id
                                      }
                                      activeOpacity={
                                        0.75
                                      }
                                      disabled={
                                        isSubmitting
                                      }
                                      onPress={() =>
                                        handleSelectOption(
                                          question.id,
                                          option.id,
                                        )
                                      }
                                      style={[
                                        styles.optionRow,
                                        isSelected &&
                                          styles.optionRowSelected,
                                      ]}
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
                                            style={
                                              styles.checkboxDot
                                            }
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
                                        {
                                          option.option_text
                                        }
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                },
                              )}
                            </View>
                          )}
                        </View>
                      ),
                    )}

                {questions.length > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={!canSubmit}
                    onPress={handleSubmit}
                    style={[
                      styles.submitButton,
                      !canSubmit &&
                        styles.submitButtonDisabled,
                    ]}
                  >
                    {isSubmitting ? (
                      <View
                        style={
                          styles.submitLoadingRow
                        }
                      >
                        <ActivityIndicator
                          size="small"
                          color={colors.white}
                        />

                        <Text
                          style={
                            styles.submitButtonText
                          }
                        >
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
                          ? "Отправить ответы"
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
                <Text
                  style={styles.modalIcon}
                >
                  {getModalIcon()}
                </Text>
              </View>

              <Text style={styles.modalTitle}>
                {resultModal.title}
              </Text>

              <Text
                style={
                  styles.modalDescription
                }
              >
                {resultModal.message}
              </Text>

              <TouchableOpacity
                style={styles.modalButton}
                activeOpacity={0.8}
                onPress={closeResultModal}
              >
                <Text
                  style={
                    styles.modalButtonText
                  }
                >
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
    backgroundColor: colors.background,
  },

  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 110,
    gap: 13,
  },

  centerContainer: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: colors.textLight,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  pageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  pageHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  pageTitle: {
    color: colors.textDark,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "800",
  },

  pageSubtitle: {
    marginTop: 4,
    color: colors.textLight,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },

  progressBadge: {
    minWidth: 66,
    minHeight: 52,
    paddingHorizontal: 9,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.violationBorder,
    borderRadius: 16,
    backgroundColor: colors.violationLight,
  },

  progressValue: {
    color: colors.accent,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "900",
  },

  progressLabel: {
    marginTop: 1,
    color: colors.textLight,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
  },

  surveyHeader: {
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.035,
    shadowRadius: 9,
    elevation: 2,
  },

  surveyTitle: {
    color: colors.textDark,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "800",
  },

  surveyDescription: {
    marginTop: 7,
    color: colors.textLight,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "400",
  },

  card: {
    padding: 15,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.035,
    shadowRadius: 9,
    elevation: 2,
  },

  questionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  questionNumber: {
    width: 28,
    height: 28,
    marginTop: 1,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.violationBorder,
    borderRadius: 14,
    backgroundColor: colors.violationLight,
  },

  questionNumberText: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
  },

  cardTitle: {
    flex: 1,
    color: colors.textDark,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
  },

  optionsList: {
    gap: 8,
  },

  optionRow: {
    minHeight: 47,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.lightGray,
  },

  optionRowSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.primaryLight,
  },

  checkbox: {
    width: 21,
    height: 21,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.inactive,
    borderRadius: 11,
    backgroundColor: colors.white,
  },

  checkboxSelected: {
    borderColor: colors.accent,
  },

  checkboxDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },

  optionText: {
    flex: 1,
    color: colors.textDark,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  optionTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },

  noOptionsContainer: {
    padding: 13,
    borderWidth: 1,
    borderColor: colors.salaryBorder,
    borderRadius: 14,
    backgroundColor: colors.salaryLight,
  },

  noOptionsText: {
    color: colors.textDark,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },

  submitButton: {
    minHeight: 48,
    marginTop: 2,
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.accent,
  },

  submitButtonDisabled: {
    backgroundColor: colors.border,
  },

  submitButtonText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
    textAlign: "center",
  },

  submitButtonTextDisabled: {
    color: colors.inactive,
  },

  submitLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  emptyCard: {
    paddingHorizontal: 22,
    paddingVertical: 29,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    backgroundColor: colors.white,
  },

  emptyIconCircle: {
    width: 64,
    height: 64,
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
  },

  emptyIcon: {
    fontSize: 29,
  },

  emptyTitle: {
    color: colors.textDark,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyDescription: {
    marginTop: 7,
    color: colors.textLight,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
  },

  retryButton: {
    minWidth: 140,
    minHeight: 44,
    marginTop: 19,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.accent,
  },

  retryButtonText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },

  modalOverlay: {
    flex: 1,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.overlay,
  },

  modalCard: {
    width: "100%",
    maxWidth: 390,
    padding: 22,
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },

  modalIconCircle: {
    width: 62,
    height: 62,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
  },

  modalIconSuccess: {
    backgroundColor: colors.successLight,
  },

  modalIconWarning: {
    backgroundColor: colors.workLight,
  },

  modalIconError: {
    backgroundColor: colors.salaryLight,
  },

  modalIconAuth: {
    backgroundColor: colors.violationLight,
  },

  modalIcon: {
    fontSize: 29,
  },

  modalTitle: {
    marginBottom: 7,
    color: colors.textDark,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "900",
    textAlign: "center",
  },

  modalDescription: {
    marginBottom: 20,
    color: colors.textLight,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
  },

  modalButton: {
    width: "100%",
    minHeight: 46,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.accent,
  },

  modalButtonText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },
});