import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';

type Props = {
  title: string;
};

export const BackHeader = ({ title }: Props) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Кнопка назад */}
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <AntDesign name="arrow-left" size={20} color="#828282" />
      </Pressable>

      {/* Заголовок по центру */}
      <Text style={styles.title}>{title}</Text>

      {/* Пустой блок для выравнивания */}
      <View style={styles.backButton} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Platform.OS === 'android' ? 70 : 60,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  backButton: {
    width: 32,
  },
  backText: {
    color: '#828282',
    fontSize: 24,
  },
  title: {
    color: '#544A4A',
    fontSize: 18,
    fontWeight: '400',
  },
});