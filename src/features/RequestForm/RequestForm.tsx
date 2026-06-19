import { colors } from '@shared/theme/colors';
import { AppButton } from '@shared/ui/AppButton';
import { InputWithCounter } from '@shared/ui/InputWithCounter';
import { ToggleSwitch } from '@shared/ui/ToggleSwitch';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { addSolution } from '@shared/api/endpoints';
import { getOrCreateUUID } from '@shared/lib/uuid';

type RequestType =
  | 'violation'
  | 'work'
  | 'salary'
  | 'social'
  | 'collective';

const TABS: { key: RequestType; title: string }[] = [
  { key: 'violation', title: 'Нарушение ТК' },
  { key: 'work', title: 'Условия труда' },
  { key: 'salary', title: 'Оплата труда' },
  { key: 'social', title: 'Социальные льготы' },
  { key: 'collective', title: 'Предложение по коллективному договору' },
];

const MOCK_USER_ID = '12345';

export const RequestForm = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<RequestType>('violation');
  const [problem, setProblem] = useState('');
  const [contacts, setContacts] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!problem.trim()) {
      Alert.alert('Ошибка', 'Опишите проблему');
      return;
    }

    const uuid = await getOrCreateUUID();

    const payload = {
      type_name: activeTab,
      problem: problem.trim(),
      solution: problem.trim(),
      phone: contacts?.trim() || undefined,
      files: [],
      uuid,
    };

    try {
      setLoading(true);

      await addSolution(payload);

      Alert.alert('Успешно', 'Обращение отправлено');

      setProblem('');
      setContacts('');
      setAnonymous(true);
      setActiveTab('violation');
    } catch (e: any) {
      console.error('❌ ADD SOLUTION ERROR:', e);
      Alert.alert(
        'Ошибка',
        e?.message || 'Не удалось отправить обращение'
      );
    } finally {
      setLoading(false);
    }
  };

  const openSheet = () => {
    console.log('Открыть выбор файлов');
  };

  return (
    <View style={styles.content}>
      <View style={styles.tabsWrapper}>
        <Text style={styles.tabsTitle}>Выберите тему обращения</Text>

        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.tabButton,
                activeTab === item.key && styles.activeTab,
              ]}
              onPress={() => setActiveTab(item.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === item.key && styles.activeTabText,
                ]}
              >
                {item.title}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <InputWithCounter
        value={problem}
        onChangeText={setProblem}
        placeholder="Опишите проблему"
        multiline
        maxLength={1000}
      />

      <InputWithCounter
        value={contacts}
        onChangeText={setContacts}
        placeholder="Оставьте контакты"
        maxLength={100}
      />

      <Pressable style={styles.uploadBtn} onPress={openSheet}>
        <Text style={styles.uploadText}>📎 Прикрепить файлы</Text>
      </Pressable>

      <View style={styles.anonBlock}>
        <View>
          <Text style={styles.anonTitle}>Анонимное обращение</Text>
          <Text style={styles.anonSubtitle}>Скрыть мои данные</Text>
        </View>

        <ToggleSwitch value={anonymous} onChange={setAnonymous} />
      </View>

      <AppButton
        title={loading ? 'Отправка...' : 'Отправить'}
        onPress={submit}
        height={50}
        disabled={loading || !problem.trim()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 20,
    paddingBottom: 100,
    backgroundColor: colors.background,
    gap: 20,
    minHeight: '100%',
  },
  tabsWrapper: {
    marginHorizontal: -15,
    gap: 12,
  },
  tabsContent: {
    paddingHorizontal: 15,
  },
  tabButton: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 24,
    marginRight: 8,
    backgroundColor: 'rgba(211, 215, 221, 1)',
  },
  activeTab: {
    backgroundColor: 'rgba(37, 99, 235, 1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(88, 88, 88, 1)',
  },
  activeTabText: {
    color: '#fff',
  },
  tabsTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 24,
    color: 'rgba(0, 0, 0, 1)',
    paddingLeft: 15,
  },
  anonBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  anonTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 24,
    color: 'rgba(0, 0, 0, 1)',
  },
  anonSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 24,
    color: 'rgba(132, 132, 132, 1)',
  },
  uploadBtn: {
    height: 50,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#079BC9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
  },
  uploadText: {
    color: '#079BC9',
    fontWeight: '700',
  },
});