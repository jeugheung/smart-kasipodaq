import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { NewsItem } from "../../entities/NewsCard";
import { colors } from "../../shared/theme/colors";

type Props = {
  news: NewsItem;
};

type NavigationProp = NativeStackNavigationProp<any>;

export const NewsItemCard = ({ news }: Props) => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => navigation.navigate("NewsDetailPage", { news })}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <ImageBackground
        source={{ uri: news.img }}
        style={styles.image}
        imageStyle={styles.imageStyle}
        resizeMode="cover"
      >
        <View style={styles.imageOverlay}>
          <View style={styles.dateContainer}>
            <Text style={styles.date}>{news.date}</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.textContainer}>
        <Text
          style={styles.title}
          numberOfLines={3}
          ellipsizeMode="tail"
        >
          {news.title}
        </Text>

        <View style={styles.buttonWrapper}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>
              {t("common.readMore")}
            </Text>

            <Text style={styles.buttonArrow}>›</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.newsCardBorder,
    borderRadius: 18,
    backgroundColor: colors.white,
    shadowColor: colors.newsCardShadow,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },

  image: {
    width: "100%",
    height: 160,
  },

  imageStyle: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },

  imageOverlay: {
    flex: 1,
    padding: 12,
    alignItems: "flex-end",
    justifyContent: "flex-start",
    backgroundColor: colors.imageOverlayLight,
  },

  dateContainer: {
    minHeight: 28,
    paddingHorizontal: 11,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.newsDateBorder,
    borderRadius: 14,
    backgroundColor: colors.newsDateBackground,
  },

  date: {
    color: colors.white,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },

  textContainer: {
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 14,
  },

  title: {
    marginBottom: 14,
    color: colors.newsTitle,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },

  buttonWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  button: {
    minHeight: 34,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.newsButtonBackground,
  },

  buttonText: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
  },

  buttonArrow: {
    marginTop: -1,
    marginLeft: 5,
    color: colors.primary,
    fontSize: 19,
    lineHeight: 19,
    fontWeight: "400",
  },
});