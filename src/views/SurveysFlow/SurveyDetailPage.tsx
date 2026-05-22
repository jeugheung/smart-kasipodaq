import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import React, { useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from "react-native";

// Моковые данные для демонстрации списка опросов
const INITIAL_SURVEYS = [
  {
    id: "1",
    tag: "Оплата труда",
    timeLeft: "4 дня осталось",
    question: "Поддерживаете ли вы проект “Отраслевого соглашения” по условиям труда на 2024 год?",
    options: ["Да", "Нет", "Возможно", "Затрудняюсь ответить"],
    selectedOption: "Да", // Предзаполненный вариант из первого макета
  },
  {
    id: "2",
    tag: "Оплата труда",
    timeLeft: "1 день остался",
    question: "Поддерживаете ли вы проект “Отраслевого соглашения” по условиям труда на 2024 год?",
    options: ["Да", "Нет", "Возможно", "Затрудняюсь ответить"],
    selectedOption: "Нет", // Предзаполненный вариант из второго макета
  },
];

export const SurveyDetailPage = ({ navigation }: any) => {
  // Состояние для хранения выбранных ответов по id опроса
  const [surveys, setSurveys] = useState(INITIAL_SURVEYS);

  const handleSelectOption = (surveyId: string, option: string) => {
    setSurveys((prev) =>
      prev.map((item) =>
        item.id === surveyId ? { ...item, selectedOption: option } : item
      )
    );
  };

  return (
    <DefaultLayout variant="back" title="Анкета 1231" onRightPress={() => alert("EN")}>
      {/* Используем ScrollView, так как карточек много и они могут не поместиться на экран */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Голосования</Text>

        {surveys.map((survey) => (
          <View key={survey.id} style={styles.card}>
            {/* Хедер карточки */}
            <View style={styles.cardHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{survey.tag}</Text>
              </View>
              <Text style={styles.timerText}>{survey.timeLeft}</Text>
            </View>

            {/* Текст вопроса */}
            <Text style={styles.cardTitle}>{survey.question}</Text>

            {/* Список вариантов ответов */}
            <View style={styles.optionsList}>
              {survey.options.map((option) => {
                const isSelected = survey.selectedOption === option;

                return (
                  <TouchableOpacity
                    key={option}
                    style={styles.optionRow}
                    activeOpacity={0.7}
                    onPress={() => handleSelectOption(survey.id, option)}
                  >
                    {/* Кастомный Чекбокс/Радиобатон */}
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <View style={styles.checkboxCheckmark} />}
                    </View>
                    
                    {/* Текст варианта */}
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: colors.background || "#F5F7FA",
  },
  content: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 100,
    gap: 16,
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
    borderColor: "#0F4C81",
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "#CCE5FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: {
    color: "#007AFF",
    fontSize: 13,
    fontWeight: "700",
  },
  timerText: {
    color: "#8E8E93",
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    color: "#000000",
    marginBottom: 4,
  },
  optionsList: {
    gap: 12, // Отступы между строками вариантов
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#0F4C81", // Цвет круга из макета
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxSelected: {
    backgroundColor: "#FFFFFF", // Оставляем белым или меняй на брендовый, если нужно заполнение
  },
  checkboxCheckmark: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0F4C81", // Точка/галочка внутри активного состояния
  },
  optionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
    flexShrink: 1, // Чтобы длинный текст корректно переносился
  },
});