import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { API_CONFIG } from "@shared/api/config";
import { RootStackParamList } from "@shared/navigation/types";
import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type LoginResponse = {
  msg: string;
  result: number;
  access_token?: string;
};

type CurrentClient = {
  id: number;
  iin: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;
  phone?: string | null;
  profsoyuz?: unknown;
  status?: number;
};

type MeResponse = {
  msg?: string;
  result?: number;
  client?: CurrentClient;
  [key: string]: unknown;
};

type LoginPageProps = NativeStackScreenProps<RootStackParamList, "LoginPage">;

export const LoginPage = ({ navigation, route }: LoginPageProps) => {
  const [iin, setIin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleIinChange = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, "");
    setIin(onlyNumbers.slice(0, 12));
  };

  const validateForm = (): boolean => {
    if (!iin) {
      Alert.alert("Ошибка", "Введите ИИН");
      return false;
    }

    if (!/^\d{12}$/.test(iin)) {
      Alert.alert("Ошибка", "ИИН должен состоять ровно из 12 цифр");
      return false;
    }

    if (!password.trim()) {
      Alert.alert("Ошибка", "Введите пароль");
      return false;
    }

    if (password.trim().length < 8) {
      Alert.alert("Ошибка", "Пароль должен содержать минимум 8 символов");
      return false;
    }

    return true;
  };

  const parseResponse = async <T,>(response: Response): Promise<T | null> => {
    const responseText = await response.text();

    if (!responseText) {
      return null;
    }

    try {
      return JSON.parse(responseText) as T;
    } catch {
      console.error("Сервер вернул некорректный JSON:", responseText);
      return null;
    }
  };

  const getCurrentUser = async (
    accessToken: string,
  ): Promise<MeResponse | null> => {
    const response = await fetch(API_CONFIG.ME_API, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await parseResponse<MeResponse>(response);

    if (!response.ok) {
      console.error("Ошибка получения пользователя:", {
        status: response.status,
        data,
      });

      if (response.status === 401) {
        throw new Error("Сессия авторизации недействительна");
      }

      throw new Error(
        typeof data?.msg === "string"
          ? data.msg
          : "Не удалось получить данные пользователя",
      );
    }

    if (data?.result !== 1) {
      throw new Error(data?.msg || "Не удалось получить данные пользователя");
    }

    return data;
  };

  const handleSuccessfulLogin = () => {
    const redirectTab = route.params?.redirectTab ?? "MainTab";

    navigation.reset({
      index: 0,
      routes: [
        {
          name: "MainTabs",
          params: {
            screen: redirectTab,
          },
        },
      ],
    });
  };

  const handleLogin = async () => {
    if (isLoading || !validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(API_CONFIG.LOGIN_API, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          iin,
          password,
        }),
      });

      const data = await parseResponse<LoginResponse>(response);

      if (!response.ok) {
        const errorMessage =
          response.status === 401
            ? "Неверный ИИН или пароль"
            : data?.msg || "Не удалось выполнить вход";

        Alert.alert("Ошибка авторизации", errorMessage);
        return;
      }

      if (!data) {
        Alert.alert("Ошибка", "Сервер вернул пустой ответ");
        return;
      }

      if (data.result !== 1) {
        Alert.alert(
          "Ошибка авторизации",
          data.msg || "Не удалось выполнить вход",
        );
        return;
      }

      if (!data.access_token) {
        Alert.alert("Ошибка", "Сервер не вернул токен авторизации");
        return;
      }

      const accessToken = data.access_token;

      await AsyncStorage.setItem("access_token", accessToken);

      try {
        const currentUser = await getCurrentUser(accessToken);

        console.log("Текущий пользователь:", currentUser);
      } catch (meError) {
        await AsyncStorage.removeItem("access_token");

        throw meError;
      }

      handleSuccessfulLogin();
    } catch (error) {
      console.error("Ошибка входа:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Не удалось подключиться к серверу";

      Alert.alert("Ошибка", message);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled =
    isLoading || iin.length !== 12 || password.trim().length < 8;

  return (
    <DefaultLayout
      variant="back"
      onRightPress={() => Alert.alert("Язык", "Переключение языка")}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerBlock}>
            <View style={styles.logoPlaceholder} />

            <Text style={styles.brandTitle}>Smart{"\n"}Kasipodaq</Text>

            <Text style={styles.brandSubtitle}>
              Войдите в систему, чтобы получить доступ к защите ваших прав
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>ИИН</Text>

              <TextInput
                style={styles.input}
                placeholder="000000000000"
                placeholderTextColor="#AFAFAF"
                value={iin}
                onChangeText={handleIinChange}
                keyboardType="number-pad"
                maxLength={12}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="next"
              />

              {iin.length > 0 && iin.length < 12 && (
                <Text style={styles.validationText}>
                  Введите ещё {12 - iin.length} цифр
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Пароль</Text>

              <TextInput
                style={styles.input}
                placeholder="Введите пароль"
                placeholderTextColor="#AFAFAF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              {password.length > 0 && password.length < 8 && (
                <Text style={styles.validationText}>Минимум 8 символов</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitDisabled && styles.submitButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleLogin}
              disabled={isSubmitDisabled}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Войти</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerLinks}>
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isLoading}
              onPress={() =>
                navigation.navigate("RegisterPage", {
                  redirectTab: route.params?.redirectTab,
                })
              }
            >
              <Text style={styles.linkText}>Регистрация</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isLoading}
              onPress={() =>
                Alert.alert(
                  "Восстановление пароля",
                  "Экран восстановления пароля ещё не подключён",
                )
              }
            >
              <Text style={styles.linkText}>Забыли пароль?</Text>
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
    flexGrow: 1,
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
    backgroundColor: "#D9D9D9",
    marginBottom: 20,
  },

  brandTitle: {
    fontSize: 36,
    fontWeight: "700",
    color: "#8E8E93",
    lineHeight: 42,
    marginBottom: 16,
  },

  brandSubtitle: {
    maxWidth: "90%",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#A5A5A5",
  },

  form: {
    gap: 20,
    marginBottom: 24,
  },

  inputContainer: {
    gap: 8,
  },

  inputLabel: {
    paddingLeft: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#A5A5A5",
  },

  input: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    color: "#1C2530",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  validationText: {
    paddingLeft: 4,
    fontSize: 12,
    fontWeight: "500",
    color: "#D14343",
  },

  submitButton: {
    height: 56,
    marginTop: 12,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#004B87",
  },

  submitButtonDisabled: {
    opacity: 0.5,
  },

  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  footerLinks: {
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },

  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999999",
  },
});
