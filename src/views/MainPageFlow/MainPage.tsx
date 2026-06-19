import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import { WelcomeCard } from "@widgets/WelcomeCard";
import { NewsWidget } from "@widgets/NewsWidget";
import { RequestsTabWidget } from "@widgets/RequestsTabWidget";

import {
  getNews,
  getViolationCount,
  getWorkCount,
  getSalaryCount,
  getSocialCount,
  getCollectiveCount
} from "@shared/api/endpoints";
import { NewsSkeleton } from "@widgets/NewsWidget/NewsSkeleton";
import { useTranslation } from "react-i18next";
import { StatisticsSkeleton } from "@widgets/StatisticsWidget/StatisticsSkeleton";
import { StatisticsWidget } from "@widgets/StatisticsWidget";


export const MainPage = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<any[]>([]);
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const [violationCount, setViolationCount] = useState(0);
  const [workCount, setWorkCount] = useState(0);
  const [salaryCount, setSalaryCount] = useState(0);
  const [socialCount, setSocialCount] = useState(0);
  const [collectiveCount, setCollectiveCount] = useState(0);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      getNews(),
      getViolationCount(),
      getWorkCount(),
      getSalaryCount(),
      getSocialCount(),
      getCollectiveCount()
    ])
      .then(
        ([
          newsResp,
          violationCountResp,
          workCountResp,
          salaryCountResp,
          socialCountResp,
          collectiveCountResp,

        ]) => {
          setNews(newsResp);
          setViolationCount(Number(violationCountResp) || 0);
          setWorkCount(Number(workCountResp) || 0);
          setSalaryCount(Number(salaryCountResp) || 0);
          setSocialCount(Number(socialCountResp) || 0);
          setCollectiveCount(Number(collectiveCountResp) || 0);
   
        }
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);


  return (
    <DefaultLayout variant="default" title="Smart Kasipodaq" onRightPress={() => alert("EN")}>
      <View style={styles.content}>
        <WelcomeCard />

        {loading ? (
          <NewsSkeleton />
        ) : (
          <NewsWidget
            news={news.map((item) => ({
              id: item.id.toString(),
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

        {/* Статистика */}
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

        {/* Здесь можно добавить другие блоки, например "Сервисы" */}
        <RequestsTabWidget />
      </View>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 20,
    paddingBottom: 100,
    backgroundColor: colors.background,
    gap: 20, // Это создаст автоматический отступ между WelcomeCard и NewsWidget
    minHeight: "100%",
  },
});