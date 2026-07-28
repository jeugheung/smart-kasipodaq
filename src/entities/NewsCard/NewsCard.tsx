import { colors } from "@shared/theme/colors";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export type NewsItem = {
  id: string;
  title: string;
  img: string;
  date: string;
  text: string;
};

type Props = {
  news: NewsItem;
};

export const NewsCard = ({ news }: Props) => {
  return (
    <View style={styles.cardContainer}>
      <Image
        source={{ uri: news.img }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{news.date}</Text>
      </View>

      <View style={styles.titleOverlay}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {news.title}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: 300,
    height: 170,
    marginRight: 14,
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: colors.imagePlaceholder,
  },

  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  dateContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: colors.imageBadge,
  },

  dateText: {
    color: colors.white,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
  },

  titleOverlay: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 11,
    justifyContent: "flex-end",
    backgroundColor: colors.imageOverlay,
  },

  title: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
});