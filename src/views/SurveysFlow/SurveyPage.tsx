import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
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

const ANKETA_LIST_API =
  "https://kasipodaq.competence.kz/api/anketa-list";

interface AnketaListItem {
  id: number;
  title: string;
  description: string | null;
  already_answered: boolean;
}

interface AnketaListResponse {
  msg: string;
  result: number;
  anketa?: AnketaListItem[];
}

interface ErrorModalState {
  visible: boolean;
  title: string;
  message: string;
  isAuthError: boolean;
}

const initialErrorModalState: ErrorModalState = {
  visible: false,
  title: "",
  message: "",
  isAuthError: false,
};

export const SurveyPage = ({ navigation }: any) => {
  const { t, i18n } = useTranslation();

  const [anketas, setAnketas] = useState<AnketaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [errorModal, setErrorModal] =
    useState<ErrorModalState>(initialErrorModalState);

  const showErrorModal = useCallback(
    (
      title: string,
      message: string,
      isAuthError = false,
    ) => {
      setErrorModal({
        visible: true,
        title,
        message,
        isAuthError,
      });
    },
    [],
  );

  const closeErrorModal = useCallback(() => {
    const shouldRedirectToLogin =
      errorModal.isAuthError;

    setErrorModal(initialErrorModalState);

    if (shouldRedirectToLogin) {
      navigation.reset({
        index: 0,
        routes: [{ name: "LoginPage" }],
      });
    }
  }, [errorModal.isAuthError, navigation]);

  const getErrorMessage = useCallback(
    (error: unknown) => {
      if (
        error instanceof Error &&
        error.message
      ) {
        return error.message;
      }

      return t("surveyPage.errors.unknown");
    },
    [t],
  );

  const fetchAnketas = useCallback(
    async (refresh = false) => {
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
          showErrorModal(
            t(
              "surveyPage.errors.authRequired.title",
            ),
            t(
              "surveyPage.errors.authRequired.message",
            ),
            true,
          );

          return;
        }

        const response = await fetch(
          ANKETA_LIST_API,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${accessToken}`,
              "Accept-Language":
                i18n.language,
            },
          },
        );

        let data: AnketaListResponse | null =
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
          await AsyncStorage.removeItem(
            "access_token",
          );

          showErrorModal(
            t(
              "surveyPage.errors.sessionExpired.title",
            ),
            t(
              "surveyPage.errors.sessionExpired.message",
            ),
            true,
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.msg ||
              t(
                "surveyPage.errors.loadError.statusMessage",
                {
                  status: response.status,
                },
              ),
          );
        }

        if (!data || data.result !== 1) {
          throw new Error(
            data?.msg ||
              t(
                "surveyPage.errors.loadError.invalidResponse",
              ),
          );
        }

        setAnketas(
          Array.isArray(data.anketa)
            ? data.anketa
            : [],
        );
      } catch (error) {
        showErrorModal(
          t(
            "surveyPage.errors.loadError.title",
          ),
          getErrorMessage(error) ||
            t(
              "surveyPage.errors.loadError.defaultMessage",
            ),
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      getErrorMessage,
      i18n.language,
      showErrorModal,
      t,
    ],
  );

  useFocusEffect(
    useCallback(() => {
      fetchAnketas();
    }, [fetchAnketas]),
  );

  const handleOpenAnketa = useCallback(
    (anketa: AnketaListItem) => {
      if (anketa.already_answered) {
        showErrorModal(
          t(
            "surveyPage.errors.alreadyAnswered.title",
          ),
          t(
            "surveyPage.errors.alreadyAnswered.message",
          ),
        );

        return;
      }

      navigation.navigate(
        "SurveyDetailPage",
        {
          anketaId: anketa.id,
        },
      );
    },
    [navigation, showErrorModal, t],
  );

  const handleChangeLanguage =
    useCallback(() => {
      const currentLanguage =
        i18n.language;

      let nextLanguage = "ru";

      if (
        currentLanguage.startsWith("ru")
      ) {
        nextLanguage = "kz";
      } else if (
        currentLanguage.startsWith("kz") ||
        currentLanguage.startsWith("kk")
      ) {
        nextLanguage = "en";
      } else {
        nextLanguage = "ru";
      }

      i18n.changeLanguage(nextLanguage);
    }, [i18n]);

  const activeAnketasCount =
    anketas.filter(
      (item) => !item.already_answered,
    ).length;

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color={colors.accent}
          />

          <Text style={styles.loadingText}>
            {t("surveyPage.loading")}
          </Text>
        </View>
      );
    }

    if (anketas.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <View
            style={styles.emptyIconCircle}
          >
            <Text style={styles.emptyIcon}>
              📋
            </Text>
          </View>

          <Text style={styles.emptyTitle}>
            {t("surveyPage.empty.title")}
          </Text>

          <Text
            style={styles.emptyDescription}
          >
            {t(
              "surveyPage.empty.description",
            )}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.8}
            onPress={() => fetchAnketas()}
          >
            <Text
              style={styles.retryButtonText}
            >
              {t(
                "surveyPage.empty.refreshButton",
              )}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return anketas.map((anketa) => {
      const isAnswered =
        anketa.already_answered;

      return (
        <TouchableOpacity
          key={anketa.id}
          activeOpacity={0.88}
          onPress={() =>
            handleOpenAnketa(anketa)
          }
          style={[
            styles.card,
            isAnswered &&
              styles.cardAnswered,
          ]}
        >
          <View style={styles.cardTop}>
            <View
              style={[
                styles.iconCircle,
                isAnswered &&
                  styles.iconCircleAnswered,
              ]}
            >
              <Text style={styles.icon}>
                {isAnswered ? "✓" : "🗳️"}
              </Text>
            </View>

            <View style={styles.cardInfo}>
              <View
                style={[
                  styles.badge,
                  isAnswered &&
                    styles.badgeAnswered,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isAnswered &&
                      styles.badgeTextAnswered,
                  ]}
                >
                  {isAnswered
                    ? t(
                        "surveyPage.card.answeredBadge",
                      )
                    : t(
                        "surveyPage.card.availableBadge",
                      )}
                </Text>
              </View>

              <Text
                style={styles.statusText}
              >
                {isAnswered
                  ? t(
                      "surveyPage.card.answeredStatus",
                    )
                  : t(
                      "surveyPage.card.availableStatus",
                    )}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.cardTitle,
              isAnswered &&
                styles.cardTitleAnswered,
            ]}
            numberOfLines={2}
          >
            {anketa.title}
          </Text>

          {!!anketa.description && (
            <Text
              style={[
                styles.cardDescription,
                isAnswered &&
                  styles.cardDescriptionAnswered,
              ]}
              numberOfLines={3}
            >
              {anketa.description}
            </Text>
          )}

          <View
            style={[
              styles.button,
              isAnswered &&
                styles.buttonAnswered,
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                isAnswered &&
                  styles.buttonTextAnswered,
              ]}
            >
              {isAnswered
                ? t(
                    "surveyPage.card.answeredButton",
                  )
                : t(
                    "surveyPage.card.openButton",
                  )}
            </Text>

            {!isAnswered && (
              <Text
                style={styles.buttonArrow}
              >
                ›
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    });
  };

  return (
    <DefaultLayout
      variant="default"
      title={t(
        "surveyPage.layoutTitle",
      )}
      onRightPress={
        handleChangeLanguage
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() =>
              fetchAnketas(true)
            }
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <View style={styles.pageHeader}>
          <View
            style={styles.pageHeaderText}
          >
            <Text style={styles.pageTitle}>
              {t(
                "surveyPage.pageTitle",
              )}
            </Text>

            <Text
              style={styles.pageSubtitle}
            >
              {t(
                "surveyPage.pageSubtitle",
              )}
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text
              style={styles.countValue}
            >
              {activeAnketasCount}
            </Text>

            <Text
              style={styles.countText}
              numberOfLines={1}
            >
              {activeAnketasCount === 1
                ? t(
                    "surveyPage.activeCount.one",
                  )
                : t(
                    "surveyPage.activeCount.many",
                  )}
            </Text>
          </View>
        </View>

        {renderContent()}
      </ScrollView>

      <Modal
        visible={errorModal.visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeErrorModal}
      >
        <View
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View
              style={
                styles.errorIconCircle
              }
            >
              <Text
                style={styles.modalIcon}
              >
                ⚠️
              </Text>
            </View>

            <Text
              style={styles.modalTitle}
            >
              {errorModal.title}
            </Text>

            <Text
              style={
                styles.modalDescription
              }
            >
              {errorModal.message}
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              activeOpacity={0.8}
              onPress={closeErrorModal}
            >
              <Text
                style={
                  styles.modalButtonText
                }
              >
                {errorModal.isAuthError
                  ? t(
                      "surveyPage.modal.loginButton",
                    )
                  : t(
                      "surveyPage.modal.closeButton",
                    )}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 110,
  },

  pageHeader: {
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  pageHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },

  pageTitle: {
    color: colors.textDark,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "800",
  },

  pageSubtitle: {
    marginTop: 5,
    color: colors.textLight,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "400",
  },

  countBadge: {
    minWidth: 64,
    minHeight: 58,
    paddingHorizontal: 9,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.violationBorder,
    borderRadius: 17,
    backgroundColor: colors.violationLight,
  },

  countValue: {
    color: colors.accent,
    fontSize: 21,
    lineHeight: 24,
    fontWeight: "800",
  },

  countText: {
    marginTop: 1,
    color: colors.textLight,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  centerContainer: {
    minHeight: 340,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: colors.textLight,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },

  emptyCard: {
    minHeight: 280,
    paddingHorizontal: 22,
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  emptyIconCircle: {
    width: 66,
    height: 66,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor:
      colors.primaryLight,
  },

  emptyIcon: {
    fontSize: 29,
  },

  emptyTitle: {
    marginTop: 17,
    color: colors.textDark,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 290,
    marginTop: 7,
    color: colors.textLight,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "400",
    textAlign: "center",
  },

  retryButton: {
    minWidth: 145,
    minHeight: 44,
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.accent,
  },

  retryButtonText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },

  card: {
    marginBottom: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  cardAnswered: {
    borderColor: colors.successBorder,
    backgroundColor:
      colors.successLight,
    shadowOpacity: 0.015,
    elevation: 1,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconCircle: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor:
      colors.violationBorder,
    borderRadius: 15,
    backgroundColor:
      colors.violationLight,
  },

  iconCircleAnswered: {
    borderColor: colors.successBorder,
    backgroundColor:
      colors.successLight,
  },

  icon: {
    color: colors.success,
    fontSize: 22,
    fontWeight: "800",
  },

  cardInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
    alignItems: "flex-start",
  },

  badge: {
    maxWidth: "100%",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor:
      colors.primaryLight,
  },

  badgeAnswered: {
    backgroundColor:
      colors.successLight,
  },

  badgeText: {
    color: colors.accent,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
  },

  badgeTextAnswered: {
    color: colors.success,
  },

  statusText: {
    marginTop: 5,
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "400",
  },

  cardTitle: {
    marginTop: 14,
    color: colors.textDark,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "800",
  },

  cardTitleAnswered: {
    color: colors.textLight,
  },

  cardDescription: {
    marginTop: 7,
    color: colors.textLight,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "400",
  },

  cardDescriptionAnswered: {
    color: colors.inactive,
  },

  button: {
    minHeight: 43,
    marginTop: 15,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.accent,
  },

  buttonAnswered: {
    borderWidth: 1,
    borderColor: colors.successBorder,
    backgroundColor:
      colors.successLight,
  },

  buttonText: {
    flexShrink: 1,
    color: colors.white,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
  },

  buttonTextAnswered: {
    color: colors.success,
  },

  buttonArrow: {
    marginTop: -1,
    marginLeft: 7,
    color: colors.white,
    fontSize: 20,
    lineHeight: 20,
    fontWeight: "500",
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
    paddingHorizontal: 22,
    paddingTop: 25,
    paddingBottom: 20,
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

  errorIconCircle: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor:
      colors.salaryLight,
  },

  modalIcon: {
    fontSize: 28,
  },

  modalTitle: {
    marginTop: 16,
    color: colors.textDark,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "800",
    textAlign: "center",
  },

  modalDescription: {
    marginTop: 8,
    color: colors.textLight,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "400",
    textAlign: "center",
  },

  modalButton: {
    width: "100%",
    minHeight: 46,
    marginTop: 21,
    paddingHorizontal: 17,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.accent,
  },

  modalButtonText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
  },
});