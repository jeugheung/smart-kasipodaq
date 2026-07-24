import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { colors } from "@shared/theme/colors";
import { getNews } from "@shared/api/endpoints";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import { NewsItem } from "@entities/NewsCard";
import { NewsItemCard } from "@entities/NewsItemCard";
import { SharedLoader } from "@shared/ui/SharedLoader/SharedLoader";

const PAGE_SIZE = 15;

const NewsLoader = () => {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.footerLoaderWrapper}>
      <View style={styles.loaderBox}>
        <Animated.View
          style={[
            styles.customSpinner,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        />
      </View>
    </View>
  );
};

export const NewsPage = () => {
  const { i18n, t } = useTranslation();

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFetching = useRef(false);

  const lang = i18n.language;

  const mapNews = useCallback(
    (data: any[]): NewsItem[] => {
      return data.map((item: any) => ({
        id: String(item.id),

        title:
          lang === "kk" || lang === "kz"
            ? item.title_kz
            : lang === "en"
              ? item.title_en
              : item.title_ru,

        date:
          lang === "kk" || lang === "kz"
            ? item.date_kz
            : lang === "en"
              ? item.date_en
              : item.date_ru,

        text:
          lang === "kk" || lang === "kz"
            ? item.full_text_kz
            : lang === "en"
              ? item.full_text_en
              : item.full_text_ru,

        img: item.image ? `https://kasipodaq.competence.kz/uploads/news/${item.image}` : "",
      }));
    },
    [lang],
  );

  const loadNews = useCallback(
    async (pageNumber: number, isRefresh = false) => {
      if (isFetching.current) {
        return;
      }

      if (!hasMore && !isRefresh) {
        return;
      }

      isFetching.current = true;
      setError(null);

      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNumber > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await getNews(pageNumber);

        const responseItems = Array.isArray(response) ? response : [];

        const mappedNews = mapNews(responseItems);

        if (isRefresh || pageNumber === 1) {
          setNews(mappedNews);
          setPage(1);
        } else {
          setNews((previousNews) => {
            const existingIds = new Set(previousNews.map((item) => item.id));

            const uniqueItems = mappedNews.filter(
              (item) => !existingIds.has(item.id),
            );

            return [...previousNews, ...uniqueItems];
          });

          setPage(pageNumber);
        }

        setHasMore(responseItems.length >= PAGE_SIZE);
      } catch (loadError) {
        console.error("Ошибка загрузки новостей:", loadError);

        setError(
          t("news.loadError", {
            defaultValue: "Не удалось загрузить новости",
          }),
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);

        setTimeout(() => {
          isFetching.current = false;
        }, 200);
      }
    },
    [hasMore, mapNews, t],
  );

  useEffect(() => {
    setNews([]);
    setPage(1);
    setHasMore(true);

    void loadNews(1, true);
  }, [lang]);

  const handleRefresh = () => {
    setHasMore(true);
    void loadNews(1, true);
  };

  const handleLoadMore = () => {
    if (isFetching.current || loading || loadingMore || !hasMore) {
      return;
    }

    void loadNews(page + 1);
  };

  const renderFooter = () => {
    if (loadingMore) {
      return <NewsLoader />;
    }

    if (!hasMore && news.length > 0) {
      return (
        <Text style={styles.endText}>
          {t("news.allCaughtUp", {
            defaultValue: "Это все новости",
          })}
        </Text>
      );
    }

    return <View style={styles.footerSpace} />;
  };

  const renderEmpty = () => {
    if (loading) {
      return null;
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>!</Text>
          </View>

          <Text style={styles.emptyTitle}>
            {t("news.errorTitle", {
              defaultValue: "Ошибка загрузки",
            })}
          </Text>

          <Text style={styles.emptyDescription}>{error}</Text>

          <Text style={styles.retryText} onPress={handleRefresh}>
            {t("news.retry", {
              defaultValue: "Повторить",
            })}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyIcon}>📰</Text>
        </View>

        <Text style={styles.emptyTitle}>
          {t("news.emptyTitle", {
            defaultValue: "Новостей пока нет",
          })}
        </Text>

        <Text style={styles.emptyDescription}>
          {t("news.emptyDescription", {
            defaultValue: "Новые публикации появятся на этой странице.",
          })}
        </Text>
      </View>
    );
  };

  return (
    <DefaultLayout
      variant="back"
      title={t("news.title", {
        defaultValue: "Новости",
      })}
    >
      <FlatList
        data={news}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NewsItemCard news={item} />}
        contentContainerStyle={[
          styles.content,
          news.length === 0 && styles.emptyContent,
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      <SharedLoader visible={loading && news.length === 0} />
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 24,
    backgroundColor: colors.background,
  },

  emptyContent: {
    flexGrow: 1,
  },

  footerLoaderWrapper: {
    width: "100%",
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  loaderBox: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",

    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  customSpinner: {
    width: 28,
    height: 28,
    borderWidth: 3,
    borderColor: "#E7EDF4",
    borderTopColor: "#002F42",
    borderRadius: 14,
  },

  footerSpace: {
    height: 45,
  },

  endText: {
    marginVertical: 28,
    color: "#8A94A3",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    textAlign: "center",
  },

  emptyContainer: {
    flex: 1,
    minHeight: 420,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIconCircle: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
    backgroundColor: "#EAF2FA",
  },

  emptyIcon: {
    color: "#0057B8",
    fontSize: 30,
    fontWeight: "800",
  },

  emptyTitle: {
    marginTop: 18,
    color: "#172033",
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 290,
    marginTop: 8,
    color: "#6D788A",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
    textAlign: "center",
  },

  retryText: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 12,
    overflow: "hidden",
    borderRadius: 13,
    backgroundColor: "#0057B8",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
