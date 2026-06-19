import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton } from '../../shared/ui/AppButton';

type RequestType =
  | 'violation'
  | 'work'
  | 'salary'
  | 'social'
  | 'collective';

type Props = {
  violation: number | string;
  work: number | string;
  salary: number | string;
  social: number | string;
  collective: number | string;
};

type NavigationProp = NativeStackNavigationProp<any>;

export const StatisticsWidget = ({
  violation,
  work,
  salary,
  social,
  collective,
}: Props) => {
  const navigation = useNavigation<NavigationProp>();

  const cards: {
    value: number | string;
    label: string;
    emoji: string;
    type: RequestType;
  }[] = [
    {
      value: violation,
      label: 'ТК',
      emoji: '⚠️',
      type: 'violation',
    },
    {
      value: work,
      label: 'Условия',
      emoji: '🛠️',
      type: 'work',
    },
    {
      value: salary,
      label: 'Оплата',
      emoji: '💰',
      type: 'salary',
    },
    {
      value: social,
      label: 'Льготы',
      emoji: '🤝',
      type: 'social',
    },
    {
      value: collective,
      label: 'Договор',
      emoji: '📄',
      type: 'collective',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Статистика</Text>

        <Text style={styles.headerCount}>
          Всего заявок:{' '}
          {Number(violation) +
            Number(work) +
            Number(salary) +
            Number(social) +
            Number(collective)}
        </Text>
      </View>
      <View style={styles.content}>
        {cards.map(item => (
          <StatCard
            key={item.type}
            value={item.value}
            label={item.label}
            emoji={item.emoji}
            type={item.type}
          />
        ))}
      </View>

      <AppButton
        title="Подать заявку"
        onPress={() =>
          navigation.navigate('RequestsTab', {
            screen: 'RequestsPage',
          })
        }
      />
    </View>
  );
};

type StatCardProps = {
  value: string | number;
  label: string;
  emoji: string;
  type: RequestType;
};

const StatCard = ({ value, label, emoji, type }: StatCardProps) => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={() =>
        navigation.navigate('RequestsList', {
          requestType: type,
        })
      }
    >
      <View style={styles.emojiBlock}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>

      <Text style={styles.value}>{value}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 15,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 16,
    borderColor: '#F2F2F2',
    padding: 10,
  },

  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 72,
    gap: 6,
  },

  card: {
    flex: 1,
    borderRadius: 12,
    gap: 5,
    alignItems: 'center',
    overflow: 'hidden',
  },

  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },

  emojiBlock: {
    width: '100%',
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },

  emoji: {
    fontSize: 20,
    marginBottom: 2,
  },

  value: {
    fontSize: 15,
    fontWeight: '700',
    color: '#002F42',
  },

  label: {
    fontSize: 9,
    fontWeight: '800',
    color: '#334155',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002F42',
  },

  headerCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
});