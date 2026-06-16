import React from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import RenderHTML from 'react-native-render-html';


import { useTranslation } from 'react-i18next';
import { DefaultLayout } from '@widgets/Layout/DefaultLayout';
import { colors } from '@shared/theme/colors';


export const NewsDetailPage = ({ route }: any) => {
  const { news } = route.params;
  const { width } = useWindowDimensions();
  const { t } = useTranslation();

  console.log('NEWS IMAGE:', news.img);

  // Очищаем HTML от лишних пробелов и неразрывных пробелов (&nbsp;), 
  // которые часто создают дыры в тексте.
  const cleanHtml = news.text
    .replace(/&nbsp;/g, ' ')
    .replace(/\s\s+/g, ' ');

  return (
    <DefaultLayout variant="back" title={t('news.single')}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Image
            source={
              typeof news.img === 'string'
                ? { uri: news.img }
                : news.img
            }
            style={styles.image}
            resizeMode="cover"
          />

          <View style={styles.mainContentBlock}>
            <Text style={styles.date}>{news.date}</Text>
            <Text style={styles.title}>{news.title}</Text>

            <RenderHTML
              contentWidth={width - 60} // Учитываем падинги (15+15 внутри блока)
              source={{ html: cleanHtml }}
              tagsStyles={htmlStyles}
              ignoredStyles={['fontSize', 'fontFamily', 'color']}
              baseStyle={{
                fontSize: 14,
                lineHeight: 22,
                color: '#222',
              }}
            />
          </View>
        </View>
        {/* Отступ снизу, чтобы текст не прилипал к краю */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </DefaultLayout>
  );
};

const htmlStyles = {
  p: {
    fontSize: 14,
    lineHeight: 22,
    color: '#222',
    marginBottom: 10,
    // Убираем justify, ставим left, чтобы не было "дыр"
    textAlign: 'left' as const, 
  },
  li: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
  },
  ul: {
    paddingLeft: 20,
    marginBottom: 10,
  },
  strong: {
    fontWeight: '700' as const,
  },
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
    backgroundColor: colors.background,
  },
  mainContentBlock: {
    gap: 15,
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#fff',
    // Небольшая тень для объема
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  date: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 26,
  },
});