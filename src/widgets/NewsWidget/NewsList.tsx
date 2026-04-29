import React from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
// import { SectionHeader } from '../../shared/ui/SectionHeader';
// import { NewsCard, NewsItem } from '../../entities/NewsCard';
import { useNavigation } from '@react-navigation/native';

import { useTranslation } from 'react-i18next';
import { SectionHeader } from '@shared/ui/SectionHeader';
import { NewsCard, NewsItem } from '../../entitites/NewsCard';

type Props = {
  news: NewsItem[];
  onPressAll?: () => void;
};

export const NewsWidget = ({ news, onPressAll }: Props) => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  return (
    <View style={styles.newsWidget}>
      {/* Оставляем заголовок в рамках стандартных отступов (если нужно, добавь ему paddingHorizontal: 15) */}
      <SectionHeader
        // title={t('news.title')}
        title='Новости'
        onPressAction={() => navigation.navigate('NewsPage')}
      />

      {/* Растягиваем контейнер на ширину всего экрана с помощью отрицательных отступов.
        Если у родителя отступ 15, ставим marginHorizontal: -15 
      */}
      <View style={styles.listWrapper}>
        <FlatList
          data={news}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          // Возвращаем отступ внутри самого списка, чтобы первая и последняя карточки не прилипали к краям
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate('NewsDetailPage', {
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
    display: 'flex',
    flexDirection: 'column',
    minHeight: 170,
    gap: 10,
  },
  listWrapper: {
    // Компенсируем боковые отступы родительского экрана (допустим, они равны 15)
    marginHorizontal: -15, 
  },
  listContent: {
    // Задаем внутренние отступы списку, чтобы контент начинался ровно по сетке, 
    // но при скролле уходил плавно за край экрана
    paddingHorizontal: 15,
 
  }
});