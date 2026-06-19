import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import React from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from "react-native";

export const ProfilePage = ({ navigation }: any) => {
  return (
    <DefaultLayout variant="default" title="Smart Kasipodaq" onRightPress={() => alert("EN")}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Аватар и информация пользователя */}
        <View style={styles.headerBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>TU</Text>
          </View>
          <Text style={styles.userName}>Test User</Text>
          <Text style={styles.userIin}>ИИН 00330055322</Text>
        </View>

        {/* Список пунктов меню */}
        <View style={styles.menuList}>
          {/* История обращений */}
          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('MyRequests')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: "#E6F4FE" }]}>
              {/* Кастомная иконка сообщения */}
              <View style={styles.msgIcon}>
                <View style={styles.msgIconDot} />
              </View>
            </View>
            <Text style={styles.menuItemText}>История обращений</Text>
            <View style={styles.arrowRight} />
          </TouchableOpacity>

          {/* История обращений */}
         

          {/* Настройки */}
          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Favourite')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: "#FFF9E6" }]}>
              {/* Кастомная иконка шестеренки */}
              <View style={styles.gearIcon} />
            </View>
            <Text style={styles.menuItemText}>Избранное</Text>
            <View style={styles.arrowRight} />
          </TouchableOpacity>

          {/* Контакты */}
          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => alert("Контакты")}
          >
            <View style={[styles.iconWrapper, { backgroundColor: "#F0FBE6" }]}>
              {/* Кастомная иконка контактов */}
              <View style={styles.contactsIcon} />
            </View>
            <Text style={styles.menuItemText}>Контакты</Text>
            <View style={styles.arrowRight} />
          </TouchableOpacity>
        </View>

        {/* Кнопка Выйти */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          activeOpacity={0.7}
            onPress={() => navigation.navigate('LoginPage')}
        >
          <Text style={styles.logoutButtonText}>Выйти</Text>
        </TouchableOpacity>
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
    paddingTop: 30,
    paddingBottom: 100,
    alignItems: "center",
    minHeight: "100%",
  },
  headerBlock: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#004B87", // Темно-синий бренд-цвет аватара
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "700",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C2530",
    marginBottom: 6,
  },
  userIin: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  menuList: {
    width: "100%",
    gap: 12,
    marginBottom: 40,
  },
  menuItem: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    // Легкая тень для отделения элементов меню, если фона нет
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#0F3049", // Темно-синий оттенок текста
  },
  arrowRight: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "#0F3049",
    transform: [{ rotate: "45deg" }],
    marginRight: 4,
  },
  // Кастомные примитивы иконок (замени на реальные SVG/иконки при наличии)
  msgIcon: {
    width: 18,
    height: 14,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  msgIconDot: {
    width: 6,
    height: 2,
    backgroundColor: "#007AFF",
  },
  gearIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#FFB300",
  },
  contactsIcon: {
    width: 14,
    height: 16,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: "#84CC16",
  },
  // Стиль для кнопки Выйти
  logoutButton: {
    width: "100%",
    backgroundColor: "rgba(255, 153, 153, 1)", // Стандартный системный красный цвет
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto", // Сдвигает кнопку вниз, если позволяет высота экрана
  },
  logoutButtonText: {
    color: "#rgba(228, 14, 14, 1)",
    fontSize: 16,
    fontWeight: "700",
  },
});