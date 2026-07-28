import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CollectiveIcon from "../../../assets/stat-icons/collective.svg";
import SalaryIcon from "../../../assets/stat-icons/salary.svg";
import SocialIcon from "../../../assets/stat-icons/social.svg";
import ViolationIcon from "../../../assets/stat-icons/violation.svg";
import WorkIcon from "../../../assets/stat-icons/work.svg";

import {
  getCollectiveSolutions,
  getSalarySolutions,
  getSocialSolutions,
  getViolationSolutions,
  getWorkSolutions,
} from "../../../src/shared/api/endpoints";

import { colors } from "../../shared/theme/colors";
import { RequestTabSkeleton } from "../../shared/ui/RequestTabSkeleton";
import { SectionHeader } from "../../shared/ui/SectionHeader";

type RequestType =
  | "violation"
  | "work"
  | "salary"
  | "social"
  | "collective";

type CardItem = {
  id: string;
  title: string;
  description: string;
};

type TranslationFunction = (
  key: string,
  options?: Record<string, unknown>,
) => string;

type TabTheme = {
  background: string;
  border: string;
};

const TAB_KEYS: RequestType[] = [
  "violation",
  "work",
  "salary",
  "social",
  "collective",
];

const TAB_ICONS: Record<RequestType, React.FC<any>> = {
  violation: ViolationIcon,
  work: WorkIcon,
  salary: SalaryIcon,
  social: SocialIcon,
  collective: CollectiveIcon,
};

const TAB_THEMES: Record<RequestType, TabTheme> = {
  violation: {
    background: colors.violationLight,
    border: colors.violationBorder,
  },
  work: {
    background: colors.workLight,
    border: colors.workBorder,
  },
  salary: {
    background: colors.salaryLight,
    border: colors.salaryBorder,
  },
  social: {
    background: colors.socialLight,
    border: colors.socialBorder,
  },
  collective: {
    background: colors.collectiveLight,
    border: colors.collectiveBorder,
  },
};

const API_CALLS: Record<RequestType, () => Promise<any[]>> = {
  violation: getViolationSolutions,
  work: getWorkSolutions,
  salary: getSalarySolutions,
  social: getSocialSolutions,
  collective: getCollectiveSolutions,
};

const getLocalizedValue = (
  item: any,
  field: "title" | "description",
  language: string,
): string => {
  const lang =
    language === "kk"
      ? "kk"
      : language === "en"
        ? "en"
        : "ru";

  if (field === "title") {
    const localizedTitle =
      lang === "kk"
        ? item.title_kz ??
          item.title_kk ??
          item.name_kz ??
          item.name_kk
        : lang === "en"
          ? item.title_en ?? item.name_en
          : item.title_ru ?? item.name_ru;

    return (
      localizedTitle ??
      item.title ??
      item.problem ??
      item.name ??
      ""
    );
  }

  const localizedDescription =
    lang === "kk"
      ? item.full_text_kz ??
        item.full_text_kk ??
        item.description_kz ??
        item.description_kk ??
        item.text_kz ??
        item.text_kk
      : lang === "en"
        ? item.full_text_en ??
          item.description_en ??
          item.text_en
        : item.full_text_ru ??
          item.description_ru ??
          item.text_ru;

  return (
    localizedDescription ??
    item.description ??
    item.solution ??
    item.text ??
    ""
  );
};

export const RequestsTabWidget = () => {
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();

  const language =
    i18n.resolvedLanguage ??
    i18n.language ??
    "ru";

  const [activeTab, setActiveTab] =
    useState<RequestType>("violation");

  const [rawData, setRawData] = useState<
    Record<RequestType, any[]>
  >({
    violation: [],
    work: [],
    salary: [],
    social: [],
    collective: [],
  });

  const [loading, setLoading] = useState<
    Record<RequestType, boolean>
  >({
    violation: true,
    work: false,
    salary: false,
    social: false,
    collective: false,
  });

  const loadedTabs = useRef<Record<RequestType, boolean>>({
    violation: false,
    work: false,
    salary: false,
    social: false,
    collective: false,
  });

  const tabs = useMemo(
    () =>
      TAB_KEYS.map((key) => ({
        key,
        title: t(`requestsWidget.tabs.${key}`),
      })),
    [t, language],
  );

  const mapResponse = (
    response: any[],
    tab: RequestType,
    translate: TranslationFunction,
  ): CardItem[] => {
    if (!Array.isArray(response)) {
      return [];
    }

    return response.map((item: any, index: number) => ({
      id:
        item.id?.toString() ??
        `${tab}-${index}`,

      title:
        getLocalizedValue(
          item,
          "title",
          language,
        ) ||
        translate("requestsWidget.untitled"),

      description: getLocalizedValue(
        item,
        "description",
        language,
      ),
    }));
  };

  const loadTabData = async (
    tab: RequestType,
    force = false,
  ) => {
    if (loadedTabs.current[tab] && !force) {
      return;
    }

    setLoading((prev) => ({
      ...prev,
      [tab]: true,
    }));

    try {
      const response = await API_CALLS[tab]();

      setRawData((prev) => ({
        ...prev,
        [tab]: Array.isArray(response)
          ? response
          : [],
      }));

      loadedTabs.current[tab] = true;
    } catch (error) {
      console.error(
        `Ошибка загрузки раздела ${tab}:`,
        error,
      );

      setRawData((prev) => ({
        ...prev,
        [tab]: [],
      }));
    } finally {
      setLoading((prev) => ({
        ...prev,
        [tab]: false,
      }));
    }
  };

  useEffect(() => {
    loadTabData("violation");
  }, []);

  const handleTabPress = (tab: RequestType) => {
    setActiveTab(tab);
    loadTabData(tab, true);
  };

  const currentData = useMemo(
    () =>
      mapResponse(
        rawData[activeTab],
        activeTab,
        t,
      ),
    [
      rawData,
      activeTab,
      language,
      t,
    ],
  );

  const currentTitle =
    tabs.find(
      (tab) => tab.key === activeTab,
    )?.title ?? "";

  const ActiveIcon = TAB_ICONS[activeTab];
  const activeTheme = TAB_THEMES[activeTab];

  return (
    <View style={styles.container}>
      <View style={styles.tabsWrapper}>
        <FlatList
          data={tabs}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={
            styles.tabsContent
          }
          renderItem={({ item }) => {
            const isActive =
              activeTab === item.key;

            const tabTheme =
              TAB_THEMES[item.key];

            return (
              <Pressable
                onPress={() =>
                  handleTabPress(item.key)
                }
                style={({ pressed }) => [
                  styles.tabButton,
                  {
                    borderColor:
                      tabTheme.border,
                  },
                  isActive && {
                    backgroundColor:
                      colors.primary,
                    borderColor:
                      colors.primary,
                  },
                  pressed &&
                    styles.tabButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive &&
                      styles.activeTabText,
                  ]}
                  numberOfLines={1}
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
          navigation.navigate(
            "RequestsList",
            {
              requestType: activeTab,
            },
          )
        }
      />

      <View style={styles.cardsContainer}>
        {loading[activeTab] ? (
          <RequestTabSkeleton />
        ) : currentData.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor:
                    activeTheme.background,
                  borderColor:
                    activeTheme.border,
                },
              ]}
            >
              <ActiveIcon
                width={28}
                height={28}
              />
            </View>

            <Text style={styles.emptyTitle}>
              {t(
                "requestsWidget.empty.title",
              )}
            </Text>

            <Text
              style={
                styles.emptyDescription
              }
            >
              {t(
                "requestsWidget.empty.description",
              )}
            </Text>
          </View>
        ) : (
          currentData.map((card) => {
            const Icon =
              TAB_ICONS[activeTab];

            return (
              <Pressable
                key={card.id}
                onPress={() =>
                  navigation.navigate(
                    "RequestsList",
                    {
                      requestType:
                        activeTab,
                    },
                  )
                }
                style={({ pressed }) => [
                  styles.card,
                  pressed &&
                    styles.cardPressed,
                ]}
              >
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor:
                        activeTheme.background,
                      borderColor:
                        activeTheme.border,
                    },
                  ]}
                >
                  <Icon
                    width={23}
                    height={23}
                  />
                </View>

                <View
                  style={
                    styles.textContainer
                  }
                >
                  <Text
                    style={styles.cardTitle}
                    numberOfLines={1}
                  >
                    {card.title}
                  </Text>

                  {!!card.description && (
                    <Text
                      style={
                        styles.cardDescription
                      }
                      numberOfLines={2}
                    >
                      {card.description}
                    </Text>
                  )}
                </View>

                <View
                  style={[
                    styles.arrowCircle,
                    {
                      backgroundColor:
                        activeTheme.background,
                      borderColor:
                        activeTheme.border,
                    },
                  ]}
                >
                  <Text
                    style={styles.arrow}
                  >
                    ›
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },

  tabsWrapper: {
    marginHorizontal: -15,
    marginBottom: 14,
  },

  tabsContent: {
    paddingHorizontal: 15,
  },

  tabButton: {
    minHeight: 34,
    marginRight: 8,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 17,
    backgroundColor: colors.white,
  },

  tabButtonPressed: {
    opacity: 0.82,
  },

  tabText: {
    color: colors.textLight,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },

  activeTabText: {
    color: colors.white,
  },

  cardsContainer: {
    marginTop: 8,
  },

  card: {
    minHeight: 78,
    marginBottom: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 2,
  },

  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.988 }],
  },

  iconCircle: {
    width: 46,
    height: 46,
    marginRight: 12,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 15,
  },

  textContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },

  cardTitle: {
    color: colors.textDark,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },

  cardDescription: {
    marginTop: 4,
    color: colors.textLight,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },

  arrowCircle: {
    width: 28,
    height: 28,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 14,
  },

  arrow: {
    marginTop: -2,
    color: colors.primary,
    fontSize: 23,
    lineHeight: 24,
    fontWeight: "700",
  },

  emptyState: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 2,
  },

  emptyIconCircle: {
    width: 60,
    height: 60,
    marginBottom: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 20,
  },

  emptyTitle: {
    marginBottom: 7,
    color: colors.textDark,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },

  emptyDescription: {
    maxWidth: 280,
    color: colors.textLight,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    textAlign: "center",
  },
});