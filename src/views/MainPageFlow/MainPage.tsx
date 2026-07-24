import React, { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

import { colors } from "@shared/theme/colors";
import { API_CONFIG } from "@shared/api/config";

import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import { WelcomeCard } from "@widgets/WelcomeCard";
import { NewsWidget } from "@widgets/NewsWidget";
import { NewsSkeleton } from "@widgets/NewsWidget/NewsSkeleton";
import { RequestsTabWidget } from "@widgets/RequestsTabWidget";
import { StatisticsWidget } from "@widgets/StatisticsWidget";
import { StatisticsSkeleton } from "@widgets/StatisticsWidget/StatisticsSkeleton";

import {
  getNews,
  getViolationCount,
  getWorkCount,
  getSalaryCount,
  getSocialCount,
  getCollectiveCount,
} from "@shared/api/endpoints";

interface Profsoyuz {
  id: number;
  name: string;
}

interface Client {
  id: number;
  last_name: string;
  first_name: string;
  middle_name: string | null;
  full_name: string;
  iin: string;
  email: string;
  phone: string;
  status: number;
  profsoyuz: Profsoyuz | null;
}

interface MeResponse {
  msg: string;
  result: number;
  client: Client | null;
}

export const MainPage = ({ navigation }: any) => {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "ru";

  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);

  const [news, setNews] = useState<any[]>([]);
  const [client, setClient] = useState<Client | null>(null);

  const [violationCount, setViolationCount] = useState(0);
  const [workCount, setWorkCount] = useState(0);
  const [salaryCount, setSalaryCount] = useState(0);
  const [socialCount, setSocialCount] = useState(0);
  const [collectiveCount, setCollectiveCount] = useState(0);

  /**
   * Получение информации об авторизованном пользователе.
   */
  const loadCurrentUser = useCallback(async () => {
    setUserLoading(true);

    try {
      const accessToken = await AsyncStorage.getItem("access_token");

      if (!accessToken) {
        setClient(null);

        // Если без авторизации нельзя открывать главную:
        // navigation.replace("Login");

        return;
      }

      const response = await fetch(API_CONFIG.ME_API, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        await AsyncStorage.removeItem("access_token");
        setClient(null);

        // navigation.replace("Login");

        return;
      }

      if (!response.ok) {
        throw new Error(
          `Ошибка получения пользователя: ${response.status}`
        );
      }

      const data: MeResponse = await response.json();

      if (data.result === 1 && data.client) {
        setClient(data.client);
      } else {
        setClient(null);
      }
    } catch (error) {
      console.error("Ошибка запроса ME_API:", error);
      setClient(null);
    } finally {
      setUserLoading(false);
    }
  }, [navigation]);

  /**
   * Получение новостей и статистики.
   */
  const loadMainPageData = useCallback(async () => {
    setLoading(true);

    try {
      const [
        newsResp,
        violationCountResp,
        workCountResp,
        salaryCountResp,
        socialCountResp,
        collectiveCountResp,
      ] = await Promise.all([
        getNews(),
        getViolationCount(),
        getWorkCount(),
        getSalaryCount(),
        getSocialCount(),
        getCollectiveCount(),
      ]);

      setNews(Array.isArray(newsResp) ? newsResp : []);

      setViolationCount(Number(violationCountResp) || 0);
      setWorkCount(Number(workCountResp) || 0);
      setSalaryCount(Number(salaryCountResp) || 0);
      setSocialCount(Number(socialCountResp) || 0);
      setCollectiveCount(Number(collectiveCountResp) || 0);
    } catch (error) {
      console.error("Ошибка загрузки главной страницы:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      loadCurrentUser(),
      loadMainPageData(),
    ]).catch(console.error);
  }, [loadCurrentUser, loadMainPageData]);

  return (
    <DefaultLayout
      variant="default"
      title="Smart Kasipodaq"
      onRightPress={() => Alert.alert("Язык", lang.toUpperCase())}
    >
      <View style={styles.content}>
        <WelcomeCard
          loading={userLoading}
          firstName={client?.first_name}
          middleName={client?.middle_name}
          profsoyuzName={client?.profsoyuz?.name}
          status={client?.status}
        />

        {loading ? (
          <NewsSkeleton />
        ) : (
          <NewsWidget
            news={news.map((item) => ({
              id: String(item.id),

              title:
                lang === "kk"
                  ? item.title_kz
                  : lang === "en"
                    ? item.title_en
                    : item.title_ru,

              date:
                lang === "kk"
                  ? item.date_kz
                  : lang === "en"
                    ? item.date_en
                    : item.date_ru,

              text:
                lang === "kk"
                  ? item.full_text_kz
                  : lang === "en"
                    ? item.full_text_en
                    : item.full_text_ru,

              img: `https://kasipodaq.competence.kz/uploads/news/${item.image}`,
            }))}
          />
        )}

        {loading ? (
          <StatisticsSkeleton />
        ) : (
          <StatisticsWidget
            violation={violationCount}
            work={workCount}
            salary={salaryCount}
            social={socialCount}
            collective={collectiveCount}
          />
        )}

        <RequestsTabWidget />
      </View>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    minHeight: "100%",
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 20,
    paddingBottom: 100,
    backgroundColor: colors.background,
    gap: 20,
  },
});