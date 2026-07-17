import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { API_CONFIG } from "@shared/api/config";
import { RootStackParamList } from "@shared/navigation/types";
import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type RegisterPageProps = NativeStackScreenProps<
  RootStackParamList,
  "RegisterPage"
>;

type Profsoyuz = {
  id: number;
  name: string;
  status: number;
  created_at?: number | string;
  updated_at?: number | string;
};

type ProfsoyuzListResponse = {
  msg?: string;
  result?: number;
  profsoyuz?: Profsoyuz[];
};

type RegisterResponse = {
  msg?: string;
  result?: number;
  access_token?: string;
  [key: string]: unknown;
};

type MeResponse = {
  msg?: string;
  result?: number;
  client?: {
    id: number;
    iin: string;
    email?: string;
    full_name?: string;
  };
  [key: string]: unknown;
};

type FormState = {
  lastName: string;
  firstName: string;
  middleName: string;
  iin: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  profsoyuzId: number | null;
};

const initialForm: FormState = {
  lastName: "",
  firstName: "",
  middleName: "",
  iin: "",
  email: "",
  phone: "+7",
  password: "",
  confirmPassword: "",
  profsoyuzId: null,
};



export const RegisterPage = ({ navigation, route }: RegisterPageProps) => {
  const [form, setForm] = useState<FormState>(initialForm);

  const [profsoyuzList, setProfsoyuzList] = useState<Profsoyuz[]>([]);

  const [isProfsoyuzLoading, setIsProfsoyuzLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const selectedProfsoyuz = useMemo(
    () => profsoyuzList.find((item) => item.id === form.profsoyuzId) ?? null,
    [form.profsoyuzId, profsoyuzList],
  );

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

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const loadProfsoyuzList = useCallback(async () => {
    try {
      setIsProfsoyuzLoading(true);

      const response = await fetch(
        API_CONFIG.PROFSOYUZ_LIST_API,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await parseResponse<ProfsoyuzListResponse>(response);

      if (!response.ok) {
        throw new Error(data?.msg || "Не удалось загрузить список профсоюзов");
      }

      if (!data) {
        throw new Error("Сервер вернул пустой ответ");
      }

      if (data.result !== 1) {
        throw new Error(data.msg || "Не удалось загрузить список профсоюзов");
      }

      const activeProfsoyuz = (data.profsoyuz ?? []).filter(
        (item) => item.status === 1,
      );

      setProfsoyuzList(activeProfsoyuz);
    } catch (error) {
      console.error("Ошибка загрузки профсоюзов:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Не удалось загрузить список профсоюзов";

      Alert.alert("Ошибка", message);
    } finally {
      setIsProfsoyuzLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfsoyuzList();
  }, [loadProfsoyuzList]);

  const handleIinChange = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, "");

    updateField("iin", onlyNumbers.slice(0, 12));
  };

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "");

    let normalizedDigits = digits;

    if (normalizedDigits.startsWith("8")) {
      normalizedDigits = "7" + normalizedDigits.slice(1);
    }

    if (!normalizedDigits.startsWith("7")) {
      normalizedDigits = "7" + normalizedDigits;
    }

    normalizedDigits = normalizedDigits.slice(0, 11);

    updateField("phone", `+${normalizedDigits}`);
  };

  const validateForm = (): boolean => {
    if (!form.lastName.trim()) {
      Alert.alert("Ошибка", "Введите фамилию");
      return false;
    }

    if (!form.firstName.trim()) {
      Alert.alert("Ошибка", "Введите имя");
      return false;
    }

    if (!form.middleName.trim()) {
      Alert.alert("Ошибка", "Введите отчество");
      return false;
    }

    if (!/^\d{12}$/.test(form.iin)) {
      Alert.alert("Ошибка", "ИИН должен состоять ровно из 12 цифр");
      return false;
    }

    const email = form.email.trim();

    if (!email) {
      Alert.alert("Ошибка", "Введите электронную почту");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Ошибка", "Введите корректную электронную почту");
      return false;
    }

    if (!/^\+7\d{10}$/.test(form.phone)) {
      Alert.alert("Ошибка", "Телефон должен быть в формате +77001234567");
      return false;
    }

    if (form.password.length < 8) {
      Alert.alert("Ошибка", "Пароль должен содержать минимум 8 символов");
      return false;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert("Ошибка", "Пароли не совпадают");
      return false;
    }

    if (!form.profsoyuzId) {
      Alert.alert("Ошибка", "Выберите профсоюз");
      return false;
    }

    return true;
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
      throw new Error(data?.msg || "Не удалось получить данные пользователя");
    }

    return data;
  };

  const navigateAfterRegistration = () => {
    const redirectTab = route.params?.redirectTab ?? "ProfileTab";

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

  const handleRegister = async () => {
    if (isSubmitting || !validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        last_name: form.lastName.trim(),
        first_name: form.firstName.trim(),
        middle_name: form.middleName.trim(),
        iin: form.iin,
        email: form.email.trim().toLowerCase(),
        phone: form.phone,
        password: form.password,
        profsoyuz_id: form.profsoyuzId,
      };

      const response = await fetch(API_CONFIG.REGISTER_API, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await parseResponse<RegisterResponse>(response);

      if (!response.ok) {
        throw new Error(data?.msg || "Не удалось выполнить регистрацию");
      }

      if (!data) {
        throw new Error("Сервер вернул пустой ответ");
      }

      if (data.result !== 1) {
        throw new Error(data.msg || "Не удалось выполнить регистрацию");
      }

      /*
       * Если API регистрации сразу возвращает токен,
       * сохраняем его и открываем профиль.
       */
      if (data.access_token) {
        await AsyncStorage.setItem("access_token", data.access_token);

        try {
          await getCurrentUser(data.access_token);
        } catch (error) {
          await AsyncStorage.removeItem("access_token");

          throw error;
        }

        navigateAfterRegistration();
        return;
      }

      /*
       * Если API регистрации не возвращает токен,
       * отправляем пользователя на страницу входа.
       */
      Alert.alert(
        "Готово",
        data.msg || "Регистрация завершена. Теперь войдите в аккаунт.",
        [
          {
            text: "Войти",
            onPress: () => {
              navigation.replace("LoginPage", {
                redirectTab: route.params?.redirectTab ?? "ProfileTab",
              });
            },
          },
        ],
      );
    } catch (error) {
      console.error("Ошибка регистрации:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Не удалось подключиться к серверу";

      Alert.alert("Ошибка", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled =
    isSubmitting ||
    !form.lastName.trim() ||
    !form.firstName.trim() ||
    !form.middleName.trim() ||
    form.iin.length !== 12 ||
    !form.email.trim() ||
    form.phone.length !== 12 ||
    form.password.length < 8 ||
    form.confirmPassword.length < 8 ||
    !form.profsoyuzId;

  return (
    <DefaultLayout
      variant="back"
      title="Регистрация"
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

            <Text style={styles.brandTitle}>Создание аккаунта</Text>

            <Text style={styles.brandSubtitle}>
              Заполните данные, чтобы получить доступ к сервисам Smart Kasipodaq
            </Text>
          </View>

          <View style={styles.form}>
            <FormInput
              label="Фамилия"
              placeholder="Введите фамилию"
              value={form.lastName}
              onChangeText={(value) => updateField("lastName", value)}
              editable={!isSubmitting}
              autoCapitalize="words"
            />

            <FormInput
              label="Имя"
              placeholder="Введите имя"
              value={form.firstName}
              onChangeText={(value) => updateField("firstName", value)}
              editable={!isSubmitting}
              autoCapitalize="words"
            />

            <FormInput
              label="Отчество"
              placeholder="Введите отчество"
              value={form.middleName}
              onChangeText={(value) => updateField("middleName", value)}
              editable={!isSubmitting}
              autoCapitalize="words"
            />

            <FormInput
              label="ИИН"
              placeholder="000000000000"
              value={form.iin}
              onChangeText={handleIinChange}
              editable={!isSubmitting}
              keyboardType="number-pad"
              maxLength={12}
            />

            {form.iin.length > 0 && form.iin.length < 12 && (
              <Text style={styles.validationText}>
                Введите ещё {12 - form.iin.length} цифр
              </Text>
            )}

            <FormInput
              label="Электронная почта"
              placeholder="example@mail.com"
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
              editable={!isSubmitting}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <FormInput
              label="Телефон"
              placeholder="+77001234567"
              value={form.phone}
              onChangeText={handlePhoneChange}
              editable={!isSubmitting}
              keyboardType="phone-pad"
              maxLength={12}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Профсоюз</Text>

              <TouchableOpacity
                style={styles.select}
                activeOpacity={0.8}
                disabled={isSubmitting || isProfsoyuzLoading}
                onPress={() => setIsSelectOpen(true)}
              >
                <Text
                  style={[
                    styles.selectText,
                    !selectedProfsoyuz && styles.selectPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {isProfsoyuzLoading
                    ? "Загрузка профсоюзов..."
                    : (selectedProfsoyuz?.name ?? "Выберите профсоюз")}
                </Text>

                {isProfsoyuzLoading ? (
                  <ActivityIndicator size="small" color="#004B87" />
                ) : (
                  <View style={styles.selectArrow} />
                )}
              </TouchableOpacity>

              {!isProfsoyuzLoading && profsoyuzList.length === 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => void loadProfsoyuzList()}
                >
                  <Text style={styles.retryText}>Повторить загрузку</Text>
                </TouchableOpacity>
              )}
            </View>

            <FormInput
              label="Пароль"
              placeholder="Минимум 8 символов"
              value={form.password}
              onChangeText={(value) => updateField("password", value)}
              editable={!isSubmitting}
              secureTextEntry
              autoCapitalize="none"
            />

            <FormInput
              label="Подтвердите пароль"
              placeholder="Введите пароль ещё раз"
              value={form.confirmPassword}
              onChangeText={(value) => updateField("confirmPassword", value)}
              editable={!isSubmitting}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            {form.confirmPassword.length > 0 &&
              form.password !== form.confirmPassword && (
                <Text style={styles.validationText}>Пароли не совпадают</Text>
              )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitDisabled && styles.submitButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleRegister}
              disabled={isSubmitDisabled}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Зарегистрироваться</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.loginBlock}>
            <Text style={styles.loginQuestion}>Уже есть аккаунт?</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isSubmitting}
              onPress={() =>
                navigation.replace("LoginPage", {
                  redirectTab: route.params?.redirectTab,
                })
              }
            >
              <Text style={styles.loginLink}>Войти</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={isSelectOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSelectOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsSelectOpen(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите профсоюз</Text>

              <TouchableOpacity
                style={styles.closeButton}
                activeOpacity={0.7}
                onPress={() => setIsSelectOpen(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={profsoyuzList}
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.selectList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Список профсоюзов пуст</Text>

                  <TouchableOpacity
                    style={styles.reloadButton}
                    activeOpacity={0.8}
                    onPress={() => void loadProfsoyuzList()}
                  >
                    <Text style={styles.reloadButtonText}>Обновить</Text>
                  </TouchableOpacity>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = item.id === form.profsoyuzId;

                return (
                  <TouchableOpacity
                    style={[
                      styles.selectItem,
                      isSelected && styles.selectItemActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      updateField("profsoyuzId", item.id);
                      setIsSelectOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.selectItemText,
                        isSelected && styles.selectItemTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>

                    {isSelected && <View style={styles.selectedDot} />}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </DefaultLayout>
  );
};

type FormInputProps = React.ComponentProps<typeof TextInput> & {
  label: string;
};

const FormInput = ({ label, style, ...props }: FormInputProps) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>

      <TextInput
        {...props}
        style={[styles.input, style]}
        placeholderTextColor="#AFAFAF"
        autoCorrect={false}
      />
    </View>
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
    paddingTop: 28,
    paddingBottom: 40,
  },

  headerBlock: {
    marginBottom: 28,
  },

  logoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#D9D9D9",
    marginBottom: 18,
  },

  brandTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: "#8E8E93",
    marginBottom: 10,
  },

  brandSubtitle: {
    maxWidth: "92%",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#A5A5A5",
  },

  form: {
    gap: 16,
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
    marginTop: -8,
    paddingLeft: 4,
    fontSize: 12,
    fontWeight: "500",
    color: "#D14343",
  },

  select: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  selectText: {
    flex: 1,
    marginRight: 12,
    fontSize: 15,
    fontWeight: "500",
    color: "#1C2530",
  },

  selectPlaceholder: {
    color: "#AFAFAF",
  },

  selectArrow: {
    width: 9,
    height: 9,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#8E8E93",
    transform: [
      {
        rotate: "45deg",
      },
    ],
    marginBottom: 5,
  },

  retryText: {
    paddingLeft: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#004B87",
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

  loginBlock: {
    marginTop: 24,
    alignItems: "center",
    gap: 8,
  },

  loginQuestion: {
    fontSize: 14,
    fontWeight: "500",
    color: "#999999",
  },

  loginLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#004B87",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },

  modalContent: {
    maxHeight: "70%",
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFFFF",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C2530",
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F3F5",
  },

  closeButtonText: {
    marginTop: -2,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "400",
    color: "#6B7280",
  },

  selectList: {
    paddingBottom: 8,
    gap: 10,
  },

  selectItem: {
    minHeight: 54,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#F7F8FA",
    flexDirection: "row",
    alignItems: "center",
  },

  selectItemActive: {
    backgroundColor: "#EAF3F8",
    borderWidth: 1,
    borderColor: "#004B87",
  },

  selectItemText: {
    flex: 1,
    marginRight: 12,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: "#1C2530",
  },

  selectItemTextActive: {
    color: "#004B87",
  },

  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#004B87",
  },

  emptyContainer: {
    paddingVertical: 36,
    alignItems: "center",
    gap: 14,
  },

  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8E8E93",
  },

  reloadButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: "#004B87",
  },

  reloadButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
