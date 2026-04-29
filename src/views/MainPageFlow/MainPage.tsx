import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import { WelcomeCard } from "@widgets/WelcomeCard";
import { NewsWidget } from "@widgets/NewsWidget";
import { RequestsTabWidget } from "@widgets/RequestsTabWidget";


// Тот самый массив данных (можно импортировать)
const MOCK_NEWS = [
  {
    id: '1',
    title: 'Открытие нового филиала профсоюза в Астане',
    img: 'https://picsum.photos/id/1/280/150',
    date: '24.05.2024',
    text: 'Текст новости...'
  },
  {
    id: '2',
    title: 'Летние путевки для членов профсоюза',
    img: 'https://picsum.photos/id/10/280/150',
    date: '20.05.2024',
    text: 'Текст новости...'
  },
  {
    id: '3',
    title: 'Изменения в Трудовом кодексе РК 2024',
    img: 'https://picsum.photos/id/20/280/150',
    date: '15.05.2024',
    text: 'Текст новости...'
  },
];

export const MainPage = ({ navigation }: any) => {

  return (
    <DefaultLayout variant="default" title="Smart Kasipodaq" onRightPress={() => alert("EN")}>
      <View style={styles.content}>
        <WelcomeCard />

        {/* Секция с новостями */}
        <NewsWidget 
          news={MOCK_NEWS} 
          onPressAll={() => navigation.navigate('NewsPage')} 
        />

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