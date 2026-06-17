import React from "react";
import { View, Text, StyleSheet, ImageBackground, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { NewsItem } from "../../entities/NewsCard";
import { colors } from "../../shared/theme/colors";
import { useTranslation } from 'react-i18next';

type Props = {
  news: NewsItem;
};

export const NewsItemCard = ({ news }: Props) => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => navigation.navigate("NewsDetailPage", { news })}
    >
      <ImageBackground
        source={{ uri: news.img }}
        style={styles.image}
        imageStyle={{ borderTopLeftRadius: 18, borderTopRightRadius: 18 }} // Чуть большее скругление
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
            <Text style={styles.buttonText}>{t('common.readMore')}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: "#fff",
    width: "100%",
    // Мягкая "дорогая" тень
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
    // Едва заметная граница дает четкость на белом фоне
    borderWidth: 1,
    borderColor: "#F1F5F9", 
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  image: {
    width: "100%",
    height: 160, // Оставили как ты просил!
  },
  imageOverlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    padding: 12,
    // Легкий градиент/затемнение можно добавить тут, если картинки сливаются, 
    // но стеклянная плашка и так будет читаться хорошо.
  },
  dateContainer: {
    // Эффект темного стекла
    backgroundColor: "rgba(15, 23, 42, 0.65)", 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
  date: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  textContainer: {
    padding: 16,
    paddingTop: 14,
  },
  title: {
    color: "#1E293B", // Более мягкий черный (Slate 800)
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24, // Добавляет "воздуха" между строками
    marginBottom: 16,
  },
  buttonWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end", // Можно поменять на 'flex-end', если хочешь кнопку справа
  },
  button: {
    paddingHorizontal: 16,
    height: 34,
    backgroundColor: "#F1F5F9", // Нежный серо-голубой фон
    borderRadius: 12, // Аккуратная форма таблетки
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 13,
    color: colors.primary, // Акцентный цвет из твоей темы
    fontWeight: "700",
  },
});