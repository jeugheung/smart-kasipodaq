import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

export const LoginPage = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Твоя логика авторизации
    alert(`Вход с данными: ${email}`);
  };

  return (
    <DefaultLayout variant="back" onRightPress={() => alert("EN")}>
      {/* KeyboardAvoidingView нужен, чтобы клавиатура не перекрывала кнопку Отправить и инпуты */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Блок Логотипа и Заголовка */}
          <View style={styles.headerBlock}>
            <View style={styles.logoPlaceholder} />
            <Text style={styles.brandTitle}>Smart{"\n"}Kasipodaq</Text>
            <Text style={styles.brandSubtitle}>
              Войдите в систему, чтобы получить доступ к защите ваших прав
            </Text>
          </View>

          {/* Форма ввода */}
          <View style={styles.form}>
            {/* Поле: Электронная почта / ИИН */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Электронная почта</Text>
              <TextInput
                style={styles.input}
                placeholder="0000 0000 0000"
                placeholderTextColor="#AFAFAF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address" // или 'numeric', если там строго ИИН
                autoCapitalize="none"
              />
            </View>

            {/* Поле: Пароль */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Пароль</Text>
              <TextInput
                style={styles.input}
                placeholder="0000 0000 0000"
                placeholderTextColor="#AFAFAF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                autoCapitalize="none"
              />
            </View>

            {/* Кнопка Отправить */}
            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.8}
              onPress={handleLogin}
            >
              <Text style={styles.submitButtonText}>Отправить</Text>
            </TouchableOpacity>
          </View>

          {/* Нижние ссылки */}
          <View style={styles.footerLinks}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => alert("Переход на регистрацию")}
            >
              <Text style={styles.linkText}>Регистрация</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => alert("Восстановление пароля")}
            >
              <Text style={styles.linkText}>Забыли пароль ?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || "#F5F7FA",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: "center",
  },
  headerBlock: {
    marginBottom: 32,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#D9D9D9", // Серый квадрат из макета
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: "700",
    color: "#8E8E93", // Приглушенный темно-серый цвет текста бренда с макета
    lineHeight: 42,
    marginBottom: 16,
  },
  brandSubtitle: {
    fontSize: 14,
    color: "#A5A5A5",
    lineHeight: 20,
    fontWeight: "500",
    maxWidth: "90%",
  },
  form: {
    gap: 20,
    marginBottom: 24,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A5A5A5",
    paddingLeft: 4,
  },
  input: {
    backgroundColor: "#FFFFFF",
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1C2530",
    fontWeight: "500",
    // Легкая тень для инпутов, чтобы соответствовать чистому белому фону на сероватом слое
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  submitButton: {
    backgroundColor: "#004B87", // Твой фирменный глубокий синий цвет
    height: 56,
    borderRadius: 28, // Полное скругление краев по макету
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  footerLinks: {
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  linkText: {
    fontSize: 14,
    color: "#999999",
    fontWeight: "600",
  },
});