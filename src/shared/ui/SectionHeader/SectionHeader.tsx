import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';

type Props = {
  title: string;
  actionText?: string;   
  onPressAction?: () => void;
};

export const SectionHeader = ({
  title,
  actionText,
  onPressAction,
}: Props) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {onPressAction && (
        <Pressable 
          onPress={onPressAction} 
          style={{ flexDirection: 'row', alignItems: 'center', gap:5 }}
        >
          <Text style={styles.actionText}>
            {/* {actionText ?? t('common.more')} */}
            Еще
          </Text>
          <AntDesign name="arrow-right" size={12} color="#828282"  />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#544A4A'
  },
  actionText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#828282',
  },
});