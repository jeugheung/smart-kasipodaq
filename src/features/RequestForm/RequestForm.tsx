import { colors } from "@shared/theme/colors";
import { AppButton } from "@shared/ui/AppButton";
import { InputWithCounter } from "@shared/ui/InputWithCounter";
import { ToggleSwitch } from "@shared/ui/ToggleSwitch";
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Pressable,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";

import { addSolution } from "@shared/api/endpoints";
import { getOrCreateUUID } from "@shared/lib/uuid";

type RequestType = "violation" | "work" | "salary" | "social" | "collective";

const TAB_KEYS: RequestType[] = [
  "violation",
  "work",
  "salary",
  "social",
  "collective",
];

export const RequestForm = ({ navigation }: any) => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<RequestType>("violation");

  const [problem, setProblem] = useState("");
  const [contacts, setContacts] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);

  const tabs = useMemo(
    () =>
      TAB_KEYS.map((key) => ({
        key,
        title: t(`requestForm.tabs.${key}`),
      })),
    [t],
  );

  const submit = async () => {
    if (!problem.trim()) {
      Alert.alert(
        t("requestForm.alerts.errorTitle"),
        t("requestForm.alerts.problemRequired"),
      );

      return;
    }

    try {
      setLoading(true);

      const uuid = await getOrCreateUUID();

      const payload = {
        type_name: activeTab,
        problem: problem.trim(),
        solution: problem.trim(),
        phone: contacts.trim() || undefined,
        files: [],
        uuid,

        // Добавь это поле, только если API его принимает:
        // is_anonymous: anonymous,
      };

      await addSolution(payload);

      Alert.alert(
        t("requestForm.alerts.successTitle"),
        t("requestForm.alerts.successMessage"),
      );

      setProblem("");
      setContacts("");
      setAnonymous(true);
      setActiveTab("violation");
    } catch (error: any) {
      console.error("❌ ADD SOLUTION ERROR:", error);

      Alert.alert(
        t("requestForm.alerts.errorTitle"),
        error?.message || t("requestForm.alerts.submitFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  const openSheet = () => {
    console.log("Открыть выбор файлов");
  };

  return (
    <View style={styles.content}>
      <View style={styles.tabsWrapper}>
        <Text style={styles.tabsTitle}>{t("requestForm.selectTopic")}</Text>

        <FlatList
          data={tabs}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item }) => {
            const isActive = activeTab === item.key;

            return (
              <Pressable
                style={[styles.tabButton, isActive && styles.activeTab]}
                onPress={() => setActiveTab(item.key)}
              >
                <Text
                  style={[styles.tabText, isActive && styles.activeTabText]}
                >
                  {item.title}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <InputWithCounter
        value={problem}
        onChangeText={setProblem}
        placeholder={t("requestForm.placeholders.problem")}
        multiline
        maxLength={1000}
      />

      <InputWithCounter
        value={contacts}
        onChangeText={setContacts}
        placeholder={t("requestForm.placeholders.contacts")}
        maxLength={100}
      />

      <Pressable style={styles.uploadBtn} onPress={openSheet}>
        <Text style={styles.uploadText}>{t("requestForm.attachFiles")}</Text>
      </Pressable>

      <View style={styles.anonBlock}>
        <View style={styles.anonTextBlock}>
          <Text style={styles.anonTitle}>
            {t("requestForm.anonymous.title")}
          </Text>

          <Text style={styles.anonSubtitle}>
            {t("requestForm.anonymous.subtitle")}
          </Text>
        </View>

        <ToggleSwitch value={anonymous} onChange={setAnonymous} />
      </View>

      <AppButton
        title={
          loading
            ? t("requestForm.buttons.sending")
            : t("requestForm.buttons.submit")
        }
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
    gap: 12,
  },

  tabsContent: {
    paddingHorizontal: 15,
  },

  tabButton: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    marginRight: 8,
    backgroundColor: "rgba(211, 215, 221, 1)",
  },

  activeTab: {
    backgroundColor: "rgba(37, 99, 235, 1)",
  },

  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(88, 88, 88, 1)",
    textAlign: "center",
  },

  activeTabText: {
    color: "#FFFFFF",
  },

  tabsTitle: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 24,
    color: "rgba(0, 0, 0, 1)",
    paddingLeft: 15,
  },

  anonBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  anonTextBlock: {
    flex: 1,
  },

  anonTitle: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 24,
    color: "rgba(0, 0, 0, 1)",
  },

  anonSubtitle: {
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 18,
    color: "rgba(132, 132, 132, 1)",
  },

  uploadBtn: {
    height: 50,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#079BC9",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F9FF",
  },

  uploadText: {
    color: "#079BC9",
    fontWeight: "700",
  },
});
