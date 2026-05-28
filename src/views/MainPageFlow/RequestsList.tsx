import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";

// --- ТИПЫ ДАННЫХ ---
type RequestStatus = "pending" | "resolved";

interface RequestItem {
  id: string;
  tag: string;
  date: string;
  problem: string;
  solution: string;
  comment?: string;
  status: RequestStatus;
  likes: number;
  dislikes: number;
  userVote: "like" | "dislike" | null;
}

// --- МОКОВЫЕ ДАННЫЕ В СТИЛЕ СВЕТЛОГО МИНИМАЛИЗМА ---
const MOCK_REQUESTS: RequestItem[] = [
  {
    id: "1",
    tag: "Зарплата",
    date: "24.12.23",
    problem: "Стипендия с GPA 2,33 что эквивалентно 70 баллам по всем дисциплинам.",
    solution: "Идея заключается в том, чтобы установить минимальный порог для получения стипендии на уровне GPA 2,33, что соответствует среднему баллу 70 по всем предметам.",
    status: "pending",
    likes: 276,
    dislikes: 24,
    userVote: null,
  },
  {
    id: "2",
    tag: "Безопасность",
    date: "23.09.23",
    problem: "ОР қызметіне ұсыныс жалғасы",
    solution: "8. Жалпы тұтынушыға да, ОР менеджерлері де бос уақытын, артық сөздерін жоғалтпас еді.\n9. Екі жаққа да тиімді болады, қай жағынан болс...",
    status: "pending",
    likes: 15,
    dislikes: 7,
    userVote: "like",
  },
  {
    id: "3",
    tag: "Отпуск",
    date: "15.09.23",
    problem: "Выделение грантов на повышение квалификации",
    solution: "Проект согласован профсоюзом. Будут выделены квоты для инженерного состава.",
    comment: "Официальный ответ: Решение принято профсоюзным комитетом, списки утверждаются.",
    status: "resolved",
    likes: 42,
    dislikes: 1,
    userVote: "like",
  },
];

const CATEGORIES = ["Все", "Зарплата", "Отпуск", "Безопасность"];

export const RequestsList = ({ navigation }: any) => {
  const [activeSegment, setActiveSegment] = useState<RequestStatus>("pending");
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [requests, setRequests] = useState<RequestItem[]>(MOCK_REQUESTS);

  // Фильтрация по табу и горизонтальным категориям
  const filteredRequests = requests.filter((item) => {
    const matchesTab = item.status === activeSegment;
    const matchesCategory = selectedCategory === "Все" || item.tag === selectedCategory;
    return matchesTab && matchesCategory;
  });

  const handleVote = (id: string, type: "like" | "dislike") => {
    setRequests((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        let newLikes = item.likes;
        let newDislikes = item.dislikes;
        let newVote = item.userVote;

        if (item.userVote === type) {
          newVote = null;
          if (type === "like") newLikes--;
          else newDislikes--;
        } else {
          if (item.userVote === "like") newLikes--;
          if (item.userVote === "dislike") newDislikes--;

          newVote = type;
          if (type === "like") newLikes++;
          else newDislikes++;
        }

        return { ...item, likes: newLikes, dislikes: newDislikes, userVote: newVote };
      })
    );
  };

  return (
    <DefaultLayout variant="back" title="Идеи">
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* МЯГКИЙ СИСТЕМНЫЙ СЕГМЕНТ-КОНТРОЛ */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[styles.segmentButton, activeSegment === "pending" && styles.segmentButtonActive]}
            onPress={() => setActiveSegment("pending")}
          >
            <Text style={[styles.segmentText, activeSegment === "pending" && styles.segmentTextActive]}>
              На рассмотрении
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentButton, activeSegment === "resolved" && styles.segmentButtonActive]}
            onPress={() => setActiveSegment("resolved")}
          >
            <Text style={[styles.segmentText, activeSegment === "resolved" && styles.segmentTextActive]}>
              Решённые вопросы
            </Text>
          </TouchableOpacity>
        </View>

        {/* ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ КАТЕГОРИЙ ИЗ НОВОГО МАКЕТА */}
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catBadge, isActive && styles.catBadgeActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.catBadgeText, isActive && styles.catBadgeTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* СПИСОК МИНИМАЛИСТИЧНЫХ КАРТОЧЕК */}
        <View style={styles.listContainer}>
          {filteredRequests.map((item) => (
            <View key={item.id} style={styles.card}>
              
              {/* Хедер карточки: Аноним, дата и иконка */}
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarEmoji}>👤</Text>
                  </View>
                  <View>
                    <Text style={styles.userNameText}>Аноним</Text>
                    <Text style={styles.dateText}>{item.date}</Text>
                  </View>
                </View>
                <View style={styles.tagLabel}>
                  <Text style={styles.tagLabelText}>{item.tag}</Text>
                </View>
              </View>

              {/* Контент обращения */}
              <View style={styles.bodyBlock}>
                <Text style={styles.problemTitle}>{item.problem}</Text>
                <Text style={styles.bodyLabel}>Вариант решения проблемы:</Text>
                <Text style={styles.solutionText}>{item.solution}</Text>
              </View>

              {/* Официальный ответ (для решенных задач) */}
              {activeSegment === "resolved" && item.comment && (
                <View style={styles.commentBlock}>
                  <Text style={styles.commentText}>{item.comment}</Text>
                </View>
              )}

              <View style={styles.divider} />

              {/* Панель взаимодействия (Лайк / Дизлайк) */}
              <View style={styles.interactionsBar}>
                <TouchableOpacity
                  style={styles.voteNode}
                  activeOpacity={0.6}
                  onPress={() => handleVote(item.id, "like")}
                >
                  <Text style={[styles.voteIcon, item.userVote === "like" && styles.activeLikeText]}>
                    {item.userVote === "like" ? "❤️" : "🤍"}
                  </Text>
                  <Text style={[styles.voteCount, item.userVote === "like" && styles.activeLikeText]}>
                    {item.likes}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.voteNode}
                  activeOpacity={0.6}
                  onPress={() => handleVote(item.id, "dislike")}
                >
                  <Text style={[styles.voteIcon, item.userVote === "dislike" && styles.activeDislikeText]}>
                    💔
                  </Text>
                  <Text style={[styles.voteCount, item.userVote === "dislike" && styles.activeDislikeText]}>
                    {item.dislikes}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          ))}

          {filteredRequests.length === 0 && (
            <Text style={styles.emptyText}>Ничего не найдено</Text>
          )}
        </View>
      </ScrollView>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: "#F8FAFC", // Светлый пастельный фон как на макетах
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
  // Таб-сегмент
  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: "#003366", // Темно-синий бренд-цвет из табов "На рассмотрении"
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#718096",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
  // Горизонтальные категории
  categoriesScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  catBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  catBadgeActive: {
    backgroundColor: "#3182CE", // Активный красивый синий из макета "Все"
  },
  catBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A5568",
  },
  catBadgeTextActive: {
    color: "#FFFFFF",
  },
  // Карточки
  listContainer: {
    gap: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EDF2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 16,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A202C",
  },
  dateText: {
    fontSize: 13,
    color: "#A0AEC0",
    fontWeight: "500",
  },
  tagLabel: {
    backgroundColor: "#EBF8FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagLabelText: {
    fontSize: 11,
    color: "#2B6CB0",
    fontWeight: "700",
  },
  bodyBlock: {
    gap: 8,
  },
  problemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A202C",
    lineHeight: 22,
  },
  bodyLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D3748",
    marginTop: 4,
  },
  solutionText: {
    fontSize: 14,
    color: "#4A5568",
    lineHeight: 20,
    fontWeight: "400",
  },
  commentBlock: {
    backgroundColor: "#F7FAFC",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderColor: "#3182CE",
    marginTop: 10,
  },
  commentText: {
    fontSize: 13,
    color: "#4A5568",
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    backgroundColor: "#EDF2F7",
    marginVertical: 14,
  },
  interactionsBar: {
    flexDirection: "row",
    gap: 20,
  },
  voteNode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  voteIcon: {
    fontSize: 16,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#718096",
  },
  activeLikeText: {
    color: "#E53E3E", // Красный оттенок для заполненного сердца лайка
    fontWeight: "700",
  },
  activeDislikeText: {
    color: "#4A5568",
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    color: "#A0AEC0",
    marginTop: 30,
    fontSize: 14,
    fontWeight: "500",
  },
});