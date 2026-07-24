import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { SectionHeader } from "@shared/ui/SectionHeader";
import { NewsCard, NewsItem } from "../../entities/NewsCard";

type Props = {
  news: NewsItem[];
  onPressAll?: () => void;
};

export const NewsWidget = ({ news, onPressAll }: Props) => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const handlePressAll = () => {
    if (onPressAll) {
      onPressAll();
      return;
    }

    navigation.navigate("NewsPage");
  };

  return (
    <View style={styles.newsWidget}>
      <SectionHeader
        title={t("news.title")}
        onPressAction={handlePressAll}
      />

      <View style={styles.listWrapper}>
        <FlatList
          data={news}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate("NewsDetailPage", {
                  news: item,
                })
              }
            >
              <NewsCard news={item} />
            </Pressable>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  newsWidget: {
    flexDirection: "column",
    minHeight: 170,
    gap: 10,
  },

  listWrapper: {
    marginHorizontal: -15,
  },

  listContent: {
    paddingHorizontal: 15,
  },
});