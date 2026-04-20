import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@shared/theme/colors';

type Props = {
  title: string;
};

export const DefaultHeader = ({ title }: Props) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
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
    overflow: 'visible'
  },

  title: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '600',
  },
});
