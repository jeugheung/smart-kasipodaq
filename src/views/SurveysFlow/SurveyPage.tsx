import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
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

const ANKETA_LIST_API = "https://kasipodaq.competence.kz/api/anketa-list";

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

  const [errorModal, setErrorModal] = useState<ErrorModalState>(
    initialErrorModalState,
  );

  const showErrorModal = useCallback(
    (title: string, message: string, isAuthError = false) => {
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
    const shouldRedirectToLogin = errorModal.isAuthError;

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
      if (error instanceof Error && error.message) {
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
        const accessToken = await AsyncStorage.getItem("access_token");

        if (!accessToken) {
          showErrorModal(
            t("surveyPage.errors.authRequired.title"),
            t("surveyPage.errors.authRequired.message"),
            true,
          );

          return;
        }

        const response = await fetch(ANKETA_LIST_API, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
            "Accept-Language": i18n.language,
          },
        });

        let data: AnketaListResponse | null = null;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (response.status === 401 || response.status === 403) {
          await AsyncStorage.removeItem("access_token");

          showErrorModal(
            t("surveyPage.errors.sessionExpired.title"),
            t("surveyPage.errors.sessionExpired.message"),
            true,
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.msg ||
              t("surveyPage.errors.loadError.statusMessage", {
                status: response.status,
              }),
          );
        }

        if (!data || data.result !== 1) {
          throw new Error(
            data?.msg || t("surveyPage.errors.loadError.invalidResponse"),
          );
        }

        setAnketas(Array.isArray(data.anketa) ? data.anketa : []);
      } catch (error) {
        showErrorModal(
          t("surveyPage.errors.loadError.title"),
          getErrorMessage(error) ||
            t("surveyPage.errors.loadError.defaultMessage"),
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [getErrorMessage, i18n.language, showErrorModal, t],
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
          t("surveyPage.errors.alreadyAnswered.title"),
          t("surveyPage.errors.alreadyAnswered.message"),
        );

        return;
      }

      navigation.navigate("SurveyDetailPage", {
        anketaId: anketa.id,
      });
    },
    [navigation, showErrorModal, t],
  );

  const handleChangeLanguage = useCallback(() => {
    const currentLanguage = i18n.language;

    let nextLanguage = "ru";

    if (currentLanguage.startsWith("ru")) {
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

  const getCurrentLanguageLabel = () => {
    if (i18n.language.startsWith("kz") || i18n.language.startsWith("kk")) {
      return "KZ";
    }

    if (i18n.language.startsWith("en")) {
      return "EN";
    }

    return "RU";
  };

  const activeAnketasCount = anketas.filter(
    (item) => !item.already_answered,
  ).length;

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0057B8" />

          <Text style={styles.loadingText}>{t("surveyPage.loading")}</Text>
        </View>
      );
    }

    if (anketas.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>📋</Text>
          </View>

          <Text style={styles.emptyTitle}>{t("surveyPage.empty.title")}</Text>

          <Text style={styles.emptyDescription}>
            {t("surveyPage.empty.description")}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.8}
            onPress={() => fetchAnketas()}
          >
            <Text style={styles.retryButtonText}>
              {t("surveyPage.empty.refreshButton")}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return anketas.map((anketa) => {
      const isAnswered = anketa.already_answered;

      return (
        <TouchableOpacity
          key={anketa.id}
          style={[styles.card, isAnswered && styles.cardAnswered]}
          activeOpacity={0.88}
          onPress={() => handleOpenAnketa(anketa)}
        >
          <View style={styles.cardTop}>
            <View
              style={[
                styles.iconCircle,
                isAnswered && styles.iconCircleAnswered,
              ]}
            >
              <Text style={styles.icon}>{isAnswered ? "✅" : "🗳️"}</Text>
            </View>

            <View style={styles.cardInfo}>
              <View style={[styles.badge, isAnswered && styles.badgeAnswered]}>
                <Text
                  style={[
                    styles.badgeText,
                    isAnswered && styles.badgeTextAnswered,
                  ]}
                >
                  {isAnswered
                    ? t("surveyPage.card.answeredBadge")
                    : t("surveyPage.card.availableBadge")}
                </Text>
              </View>

              <Text style={styles.statusText}>
                {isAnswered
                  ? t("surveyPage.card.answeredStatus")
                  : t("surveyPage.card.availableStatus")}
              </Text>
            </View>
          </View>

          <Text
            style={[styles.cardTitle, isAnswered && styles.cardTitleAnswered]}
          >
            {anketa.title}
          </Text>

          {!!anketa.description && (
            <Text
              style={[
                styles.cardDescription,
                isAnswered && styles.cardDescriptionAnswered,
              ]}
              numberOfLines={4}
            >
              {anketa.description}
            </Text>
          )}

          <View style={[styles.button, isAnswered && styles.buttonAnswered]}>
            <Text
              style={[
                styles.buttonText,
                isAnswered && styles.buttonTextAnswered,
              ]}
            >
              {isAnswered
                ? t("surveyPage.card.answeredButton")
                : t("surveyPage.card.openButton")}
            </Text>

            {!isAnswered && <Text style={styles.buttonArrow}>→</Text>}
          </View>
        </TouchableOpacity>
      );
    });
  };

  return (
    <DefaultLayout
      variant="default"
      title={t("surveyPage.layoutTitle")}
      onRightPress={handleChangeLanguage}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchAnketas(true)}
            tintColor="#0057B8"
            colors={["#0057B8"]}
          />
        }
      >
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderText}>
            <Text style={styles.pageTitle}>{t("surveyPage.pageTitle")}</Text>

            <Text style={styles.pageSubtitle}>
              {t("surveyPage.pageSubtitle")}
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countValue}>{activeAnketasCount}</Text>

            <Text style={styles.countText}>
              {activeAnketasCount === 1
                ? t("surveyPage.activeCount.one")
                : t("surveyPage.activeCount.many")}
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.errorIconCircle}>
              <Text style={styles.modalIcon}>⚠️</Text>
            </View>

            <Text style={styles.modalTitle}>{errorModal.title}</Text>

            <Text style={styles.modalDescription}>{errorModal.message}</Text>

            <TouchableOpacity
              style={styles.modalButton}
              activeOpacity={0.8}
              onPress={closeErrorModal}
            >
              <Text style={styles.modalButtonText}>
                {errorModal.isAuthError
                  ? t("surveyPage.modal.loginButton")
                  : t("surveyPage.modal.closeButton")}
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
    backgroundColor: "#F4F7FB",
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 120,
  },

  pageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  pageHeaderText: {
    flex: 1,
    paddingRight: 14,
  },

  pageTitle: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "800",
    color: "#111827",
  },

  pageSubtitle: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
    color: "#64748B",
  },

  countBadge: {
    minWidth: 72,
    minHeight: 64,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#E8F1FF",
    borderWidth: 1,
    borderColor: "#CFE1FA",
  },

  countValue: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
    color: "#0057B8",
  },

  countText: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    color: "#47719F",
    textAlign: "center",
  },

  centerContainer: {
    flex: 1,
    minHeight: 380,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
    color: "#64748B",
  },

  emptyCard: {
    minHeight: 320,
    paddingHorizontal: 24,
    paddingVertical: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5EAF1",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },

  emptyIconCircle: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 38,
    backgroundColor: "#EDF4FF",
  },

  emptyIcon: {
    fontSize: 34,
  },

  emptyTitle: {
    marginTop: 20,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "800",
    color: "#172033",
    textAlign: "center",
  },

  emptyDescription: {
    marginTop: 9,
    maxWidth: 290,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
    color: "#6B7280",
    textAlign: "center",
  },

  retryButton: {
    marginTop: 24,
    minWidth: 150,
    minHeight: 48,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#0057B8",
  },

  retryButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  card: {
    marginBottom: 16,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E8F2",
    shadowColor: "#152238",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },

  cardAnswered: {
    backgroundColor: "#F7F8FA",
    borderColor: "#E4E7EC",
    shadowOpacity: 0.02,
    elevation: 1,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconCircle: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#E8F1FF",
  },

  iconCircleAnswered: {
    backgroundColor: "#E8F7EE",
  },

  icon: {
    fontSize: 25,
  },

  cardInfo: {
    flex: 1,
    marginLeft: 13,
    alignItems: "flex-start",
  },

  badge: {
    maxWidth: "100%",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 30,
    backgroundColor: "#E6F0FF",
  },

  badgeAnswered: {
    backgroundColor: "#E6F5EC",
  },

  badgeText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    color: "#0057B8",
  },

  badgeTextAnswered: {
    color: "#1A7F45",
  },

  statusText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "400",
    color: "#7A8699",
  },

  cardTitle: {
    marginTop: 18,
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "800",
    color: "#172033",
  },

  cardTitleAnswered: {
    color: "#5F6877",
  },

  cardDescription: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
    color: "#64748B",
  },

  cardDescriptionAnswered: {
    color: "#8B93A1",
  },

  button: {
    marginTop: 19,
    minHeight: 49,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#0057B8",
  },

  buttonAnswered: {
    backgroundColor: "#E7EAEE",
  },

  buttonText: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },

  buttonTextAnswered: {
    color: "#717A89",
  },

  buttonArrow: {
    marginLeft: 9,
    fontSize: 21,
    lineHeight: 24,
    fontWeight: "500",
    color: "#FFFFFF",
  },

  modalOverlay: {
    flex: 1,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(12, 20, 34, 0.56)",
  },

  modalCard: {
    width: "100%",
    maxWidth: 390,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: "center",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },

  errorIconCircle: {
    width: 66,
    height: 66,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 33,
    backgroundColor: "#FFF2E8",
  },

  modalIcon: {
    fontSize: 31,
  },

  modalTitle: {
    marginTop: 18,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "800",
    color: "#172033",
    textAlign: "center",
  },

  modalDescription: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
    color: "#687386",
    textAlign: "center",
  },

  modalButton: {
    width: "100%",
    minHeight: 50,
    marginTop: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#0057B8",
  },

  modalButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
});
