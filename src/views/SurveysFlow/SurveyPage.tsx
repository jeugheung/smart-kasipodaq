import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";

export const SurveyPage = ({ navigation }: any) => {
  

  return (
    <DefaultLayout variant="default" title="Smart Kasipodaq" onRightPress={() => alert("EN")}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Голосования</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Оплата труда</Text>
            </View>
            <Text style={styles.timerText}>4 дня осталось</Text>
          </View>

          <Text style={styles.cardTitle}>
            Поддерживаете ли вы проект “Отраслевого соглашения” по условиям
            труда на 2024 год?
          </Text>

          <TouchableOpacity 
            style={styles.button} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SurveyDetailPage')}
          >
            <Text style={styles.buttonText}>Пройти опрос</Text>
          </TouchableOpacity>
        </View>
      </View>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 100,
    backgroundColor: colors.background || "#F5F7FA", // фолбек, если в colors пусто
    gap: 16,
    minHeight: "100%",
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#0F4C81", // Твой темно-синий цвет рамки с макета
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "#CCE5FF", // Нежно-голубой фон плашки
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: {
    color: "#007AFF", // Синий текст внутри плашки
    fontSize: 13,
    fontWeight: "700",
  },
  timerText: {
    color: "#8E8E93", // Серый текст таймера
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    color: "#000000",
  },
  button: {
    backgroundColor: "#D1DCE6", // Светло-серый/голубоватый фон кнопки
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#1C2530", // Темный текст кнопки
    fontSize: 14,
    fontWeight: "700",
  },
});