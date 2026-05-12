import { colors } from "@shared/theme/colors";
import { AppButton } from "@shared/ui/AppButton";
import { InputWithCounter } from "@shared/ui/InputWithCounter";
import { ToggleSwitch } from "@shared/ui/ToggleSwitch";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, FlatList, Pressable } from "react-native";


export const RequestForm = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<RequestType>('ideas');
  const [problem, setProblem] = useState("");
  const [contacts, setContacts] = useState("");
  const [anonymous, setAnonymous] = useState(true);

  const [loading, setLoading] = useState(false);

  type RequestType =
    | "ideas"
    | "management"
    | "science"
    | "service"
    | "service1";

  const TABS: { key: RequestType; titleKey: string }[] = [
    { key: "ideas", titleKey: "Нарушение ТК" },
    { key: "management", titleKey: "Условия труда" },
    { key: "science", titleKey: "Оплата труда" },
    { key: "service", titleKey: "Социальные льготы" },
    { key: "service1", titleKey: "Предложение по коллективному договору" },
  ];

  const submit = () => {

  }

  return (
    <View style={styles.content}>
      {/* 1. ТАБЫ (Горизонтальный список) */}
      <View style={styles.tabsWrapper}>
        <Text style={styles.tabsTitle}>Выберите тему обращения</Text>
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
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
                {item.titleKey}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <InputWithCounter
        value={problem}
        onChangeText={setProblem}
        placeholder={"Опишите проблему"}
        multiline
        maxLength={1000}
      />
      <InputWithCounter
        value={contacts}
        onChangeText={setContacts}
        placeholder={"Оставьте контакты"}
        maxLength={100}
      />

      <View style={styles.anonBlock}>
        <View>
          <Text style={styles.anonTitle}>Анонимное обращение</Text>
          <Text style={styles.anonSubtitle}>Скрыть мои данные</Text>
        </View>

        <ToggleSwitch
          value={anonymous} onChange={function (value: boolean): void {
            throw new Error("Function not implemented.");
          } }         
        />
      </View>

      <AppButton
        title={loading ? "ds" : "111"}
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
    minHeight: "100%",
  },
  tabsWrapper: {
    marginHorizontal: -15,
    gap: 12
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
    backgroundColor: '#rgba(211, 215, 221, 1)', // Фон для неактивных табов
  },
  activeTab: {
    backgroundColor: '#rgba(37, 99, 235, 1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#rgba(88, 88, 88, 1)',
  },
  activeTabText: {
    color: '#fff',
  },
  tabsTitle: {
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 24,
    color: 'rgba(0, 0, 0, 1)',
    paddingLeft: 15
  },
  anonBlock: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  anonTitle: {
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 24,
    color: 'rgba(0, 0, 0, 1)',
  },
  anonSubtitle: {
    fontSize: 10,
    fontWeight: 500,
    lineHeight: 24,
    color: 'rgba(132, 132, 132, 1)',
  }
});
