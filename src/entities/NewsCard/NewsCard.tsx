import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

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
      {/* 1. Используем обычный Image на фоне */}
      <Image
        source={{ uri: news.img }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />


      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{news.date}</Text>
      </View>

      <View style={styles.titleContainer}>
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
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 20,
    backgroundColor: '#E5E7EB', // Временный серый фон-заглушка (пока грузится картинка)
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject, // Растягивает картинку на весь родительский View
    width: '100%',
    height: '100%',
  },
  dateContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: "rgba(0,0,0,0.4)"
  },
  dateText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    padding: 10,
    maxHeight: 52,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    backgroundColor: "rgba(0,0,0,0.4)"
  },
  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});