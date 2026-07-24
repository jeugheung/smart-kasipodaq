import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { API_CONFIG } from "@shared/api/config";
import { RootStackParamList } from "@shared/navigation/types";
import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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

type FormInputProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
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

const LOGIN_LOGO = require("../../../assets/splash-icon.png");

export const RegisterPage = ({ navigation, route }: RegisterPageProps) => {
  const { t } = useTranslation();

  const [form, setForm] = useState<FormState>(initialForm);

  const [profsoyuzList, setProfsoyuzList] = useState<Profsoyuz[]>([]);

  const [isProfsoyuzLoading, setIsProfsoyuzLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

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

      const response = await fetch(API_CONFIG.PROFSOYUZ_LIST_API, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await parseResponse<ProfsoyuzListResponse>(response);

      if (!response.ok) {
        throw new Error(data?.msg || t("registerPage.errors.profsoyuzLoad"));
      }

      if (!data) {
        throw new Error(t("registerPage.errors.emptyResponse"));
      }

      if (data.result !== 1) {
        throw new Error(data.msg || t("registerPage.errors.profsoyuzLoad"));
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
          : t("registerPage.errors.profsoyuzLoad");

      Alert.alert(t("registerPage.alerts.errorTitle"), message);
    } finally {
      setIsProfsoyuzLoading(false);
    }
  }, [t]);

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
      Alert.alert(
        t("registerPage.alerts.errorTitle"),
        t("registerPage.validation.lastNameRequired"),
      );

      return false;
    }

    if (!form.firstName.trim()) {
      Alert.alert(
        t("registerPage.alerts.errorTitle"),
        t("registerPage.validation.firstNameRequired"),
      );

      return false;
    }

    if (!form.middleName.trim()) {
      Alert.alert(
        t("registerPage.alerts.errorTitle"),
        t("registerPage.validation.middleNameRequired"),
      );

      return false;
    }

    if (!/^\d{12}$/.test(form.iin)) {
      Alert.alert(
        t("registerPage.alerts.errorTitle"),
        t("registerPage.validation.iinLength"),
      );

      return false;
    }

    const email = form.email.trim();

    if (!email) {
      Alert.alert(
        t("registerPage.alerts.errorTitle"),
        t("registerPage.validation.emailRequired"),
      );

      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert(
        t("registerPage.alerts.errorTitle"),
        t("registerPage.validation.emailInvalid"),
      );

      return false;
    }

    if (!/^\+7\d{10}$/.test(form.phone)) {
      Alert.alert(
        t("registerPage.alerts.errorTitle"),
        t("registerPage.validation.phoneInvalid"),
      );

      return false;
    }

    if (form.password.length < 8) {
      Alert.alert(
        t("registerPage.alerts.errorTitle"),
        t("registerPage.validation.passwordLength"),
      );

      return false;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert(
        t("registerPage.alerts.errorTitle"),
        t("registerPage.validation.passwordMismatch"),
      );

      return false;
    }

    if (!form.profsoyuzId) {
      Alert.alert(
        t("registerPage.alerts.errorTitle"),
        t("registerPage.validation.profsoyuzRequired"),
      );

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
      throw new Error(data?.msg || t("registerPage.errors.userLoad"));
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
        throw new Error(
          data?.msg || t("registerPage.errors.registrationFailed"),
        );
      }

      if (!data) {
        throw new Error(t("registerPage.errors.emptyResponse"));
      }

      if (data.result !== 1) {
        throw new Error(
          data.msg || t("registerPage.errors.registrationFailed"),
        );
      }

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

      Alert.alert(
        t("registerPage.success.title"),
        data.msg || t("registerPage.success.message"),
        [
          {
            text: t("registerPage.success.loginButton"),
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
          : t("registerPage.errors.connection");

      Alert.alert(t("registerPage.alerts.errorTitle"), message);
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

  const iinError =
    form.iin.length > 0 && form.iin.length < 12
      ? t("registerPage.validation.remainingDigits", {
          count: 12 - form.iin.length,
        })
      : undefined;

  const passwordError =
    form.password.length > 0 && form.password.length < 8
      ? t("registerPage.validation.passwordShort")
      : undefined;

  const confirmPasswordError =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword
      ? t("registerPage.validation.passwordMismatch")
      : undefined;

  return (
    <DefaultLayout variant="back" title={t("registerPage.layoutTitle")}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerBlock}>
            <View style={styles.logoContainer}>
              <Image
                source={LOGIN_LOGO}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.brandName}>Smart Kasipodaq</Text>

            <Text style={styles.brandTitle}>{t("registerPage.title")}</Text>

            <Text style={styles.brandSubtitle}>
              {t("registerPage.subtitle")}
            </Text>
          </View>

          <View style={styles.formCard}>
            <FormInput
              label={t("registerPage.fields.lastNameLabel")}
              placeholder={t("registerPage.fields.lastNamePlaceholder")}
              value={form.lastName}
              onChangeText={(value) => updateField("lastName", value)}
              editable={!isSubmitting}
              autoCapitalize="words"
            />

            <FormInput
              label={t("registerPage.fields.firstNameLabel")}
              placeholder={t("registerPage.fields.firstNamePlaceholder")}
              value={form.firstName}
              onChangeText={(value) => updateField("firstName", value)}
              editable={!isSubmitting}
              autoCapitalize="words"
            />

            <FormInput
              label={t("registerPage.fields.middleNameLabel")}
              placeholder={t("registerPage.fields.middleNamePlaceholder")}
              value={form.middleName}
              onChangeText={(value) => updateField("middleName", value)}
              editable={!isSubmitting}
              autoCapitalize="words"
            />

            <FormInput
              label={t("registerPage.fields.iinLabel")}
              placeholder="000000000000"
              value={form.iin}
              onChangeText={handleIinChange}
              editable={!isSubmitting}
              keyboardType="number-pad"
              maxLength={12}
              error={iinError}
            />

            <FormInput
              label={t("registerPage.fields.emailLabel")}
              placeholder="example@mail.com"
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
              editable={!isSubmitting}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <FormInput
              label={t("registerPage.fields.phoneLabel")}
              placeholder="+77001234567"
              value={form.phone}
              onChangeText={handlePhoneChange}
              editable={!isSubmitting}
              keyboardType="phone-pad"
              maxLength={12}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {t("registerPage.fields.profsoyuzLabel")}
              </Text>

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
                    ? t("registerPage.profsoyuz.loading")
                    : (selectedProfsoyuz?.name ??
                      t("registerPage.profsoyuz.placeholder"))}
                </Text>

                {isProfsoyuzLoading ? (
                  <ActivityIndicator size="small" color="#0057B8" />
                ) : (
                  <View style={styles.selectArrow} />
                )}
              </TouchableOpacity>

              {!isProfsoyuzLoading && profsoyuzList.length === 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => void loadProfsoyuzList()}
                >
                  <Text style={styles.retryText}>
                    {t("registerPage.profsoyuz.retry")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {t("registerPage.fields.passwordLabel")}
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  passwordError && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  style={styles.inputInside}
                  placeholder={t("registerPage.fields.passwordPlaceholder")}
                  placeholderTextColor="#A7B0C0"
                  value={form.password}
                  onChangeText={(value) => updateField("password", value)}
                  editable={!isSubmitting}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor="#0057B8"
                />

                <TouchableOpacity
                  style={styles.passwordButton}
                  activeOpacity={0.7}
                  onPress={() => setIsPasswordVisible((current) => !current)}
                >
                  <Text style={styles.passwordButtonText}>
                    {isPasswordVisible
                      ? t("registerPage.fields.hidePassword")
                      : t("registerPage.fields.showPassword")}
                  </Text>
                </TouchableOpacity>
              </View>

              {!!passwordError && (
                <Text style={styles.validationText}>{passwordError}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {t("registerPage.fields.confirmPasswordLabel")}
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  confirmPasswordError && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  style={styles.inputInside}
                  placeholder={t(
                    "registerPage.fields.confirmPasswordPlaceholder",
                  )}
                  placeholderTextColor="#A7B0C0"
                  value={form.confirmPassword}
                  onChangeText={(value) =>
                    updateField("confirmPassword", value)
                  }
                  editable={!isSubmitting}
                  secureTextEntry={!isConfirmPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  selectionColor="#0057B8"
                  onSubmitEditing={handleRegister}
                />

                <TouchableOpacity
                  style={styles.passwordButton}
                  activeOpacity={0.7}
                  onPress={() =>
                    setIsConfirmPasswordVisible((current) => !current)
                  }
                >
                  <Text style={styles.passwordButtonText}>
                    {isConfirmPasswordVisible
                      ? t("registerPage.fields.hidePassword")
                      : t("registerPage.fields.showPassword")}
                  </Text>
                </TouchableOpacity>
              </View>

              {!!confirmPasswordError && (
                <Text style={styles.validationText}>
                  {confirmPasswordError}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitDisabled && styles.submitButtonDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleRegister}
              disabled={isSubmitDisabled}
            >
              {isSubmitting ? (
                <View style={styles.loadingButtonContent}>
                  <ActivityIndicator size="small" color="#FFFFFF" />

                  <Text style={styles.submitButtonText}>
                    {t("registerPage.registering")}
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>
                  {t("registerPage.registerButton")}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.loginBlock}>
            <Text style={styles.loginQuestion}>
              {t("registerPage.alreadyHaveAccount")}
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isSubmitting}
              onPress={() =>
                navigation.replace("LoginPage", {
                  redirectTab: route.params?.redirectTab,
                })
              }
            >
              <Text style={styles.loginLink}>
                {t("registerPage.loginButton")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={isSelectOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
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
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("registerPage.profsoyuz.modalTitle")}
              </Text>

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
                  <View style={styles.emptyIconCircle}>
                    <Text style={styles.emptyIcon}>🏢</Text>
                  </View>

                  <Text style={styles.emptyText}>
                    {t("registerPage.profsoyuz.empty")}
                  </Text>

                  <TouchableOpacity
                    style={styles.reloadButton}
                    activeOpacity={0.8}
                    onPress={() => void loadProfsoyuzList()}
                  >
                    <Text style={styles.reloadButtonText}>
                      {t("registerPage.profsoyuz.reload")}
                    </Text>
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
                    activeOpacity={0.75}
                    onPress={() => {
                      updateField("profsoyuzId", item.id);

                      setIsSelectOpen(false);
                    }}
                  >
                    <View
                      style={[
                        styles.organizationIcon,
                        isSelected && styles.organizationIconActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.organizationIconText,
                          isSelected && styles.organizationIconTextActive,
                        ]}
                      >
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.selectItemText,
                        isSelected && styles.selectItemTextActive,
                      ]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>

                    <View
                      style={[
                        styles.radioOuter,
                        isSelected && styles.radioOuterActive,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
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

const FormInput = ({ label, error, style, ...props }: FormInputProps) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>

      <TextInput
        {...props}
        style={[styles.input, !!error && styles.inputError, style]}
        placeholderTextColor="#A7B0C0"
        selectionColor="#0057B8"
        autoCorrect={false}
      />

      {!!error && <Text style={styles.validationText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || "#F4F7FB",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 44,
  },

  headerBlock: {
    alignItems: "center",
    marginBottom: 28,
  },

  logoContainer: {
    width: 92,
    height: 92,
    marginBottom: 17,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    backgroundColor: "#0867CD",

    shadowColor: "#0867CD",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },

  logo: {
    width: 68,
    height: 68,
  },

  brandName: {
    color: "#111827",
    fontSize: 26,
    lineHeight: 33,
    fontWeight: "800",
    textAlign: "center",
  },

  brandTitle: {
    marginTop: 13,
    color: "#172033",
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "800",
    textAlign: "center",
  },

  brandSubtitle: {
    maxWidth: 320,
    marginTop: 7,
    color: "#687386",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
    textAlign: "center",
  },

  formCard: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "#E3EAF3",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",

    shadowColor: "#11233E",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 4,
  },

  inputContainer: {
    marginBottom: 17,
  },

  inputLabel: {
    marginBottom: 8,
    paddingLeft: 3,
    color: "#344054",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },

  input: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#D9E1EC",
    borderRadius: 15,
    backgroundColor: "#F9FBFD",
    color: "#172033",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },

  inputError: {
    borderColor: "#E96A6A",
    backgroundColor: "#FFF9F9",
  },

  inputWrapper: {
    minHeight: 56,
    paddingLeft: 16,
    paddingRight: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D9E1EC",
    borderRadius: 15,
    backgroundColor: "#F9FBFD",
  },

  inputWrapperError: {
    borderColor: "#E96A6A",
    backgroundColor: "#FFF9F9",
  },

  inputInside: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    paddingVertical: 12,
    color: "#172033",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },

  passwordButton: {
    minHeight: 40,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  passwordButtonText: {
    color: "#0057B8",
    fontSize: 12,
    fontWeight: "700",
  },

  validationText: {
    marginTop: 6,
    paddingLeft: 3,
    color: "#D14343",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },

  select: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D9E1EC",
    borderRadius: 15,
    backgroundColor: "#F9FBFD",
  },

  selectText: {
    flex: 1,
    marginRight: 12,
    color: "#172033",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },

  selectPlaceholder: {
    color: "#A7B0C0",
  },

  selectArrow: {
    width: 9,
    height: 9,
    marginBottom: 5,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#667085",
    transform: [{ rotate: "45deg" }],
  },

  retryText: {
    marginTop: 7,
    paddingLeft: 3,
    color: "#0057B8",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },

  submitButton: {
    minHeight: 56,
    marginTop: 4,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#0057B8",

    shadowColor: "#0057B8",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },

  submitButtonDisabled: {
    backgroundColor: "#AEBFD4",
    shadowOpacity: 0,
    elevation: 0,
  },

  loadingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  submitButtonText: {
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    textAlign: "center",
  },

  loginBlock: {
    marginTop: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
  },

  loginQuestion: {
    color: "#7A8494",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },

  loginLink: {
    marginLeft: 5,
    color: "#0057B8",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(12, 20, 34, 0.56)",
  },

  modalContent: {
    maxHeight: "76%",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFFFF",
  },

  modalHandle: {
    width: 44,
    height: 5,
    marginBottom: 15,
    alignSelf: "center",
    borderRadius: 3,
    backgroundColor: "#D8DEE8",
  },

  modalHeader: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitle: {
    flex: 1,
    paddingRight: 12,
    color: "#172033",
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "800",
  },

  closeButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#F1F4F8",
  },

  closeButtonText: {
    marginTop: -2,
    color: "#667085",
    fontSize: 27,
    lineHeight: 29,
    fontWeight: "400",
  },

  selectList: {
    paddingBottom: 8,
  },

  selectItem: {
    minHeight: 66,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E7ECF3",
    borderRadius: 16,
    backgroundColor: "#F9FBFD",
  },

  selectItemActive: {
    borderColor: "#8DBBEA",
    backgroundColor: "#EDF5FF",
  },

  organizationIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#E8EEF6",
  },

  organizationIconActive: {
    backgroundColor: "#D8EAFE",
  },

  organizationIconText: {
    color: "#667085",
    fontSize: 16,
    fontWeight: "800",
  },

  organizationIconTextActive: {
    color: "#0057B8",
  },

  selectItemText: {
    flex: 1,
    marginRight: 12,
    color: "#253043",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  selectItemTextActive: {
    color: "#0057B8",
    fontWeight: "700",
  },

  radioOuter: {
    width: 21,
    height: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#B8C1CE",
    borderRadius: 11,
  },

  radioOuterActive: {
    borderColor: "#0057B8",
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#0057B8",
  },

  emptyContainer: {
    paddingVertical: 36,
    alignItems: "center",
  },

  emptyIconCircle: {
    width: 66,
    height: 66,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 33,
    backgroundColor: "#EEF4FC",
  },

  emptyIcon: {
    fontSize: 29,
  },

  emptyText: {
    marginTop: 15,
    color: "#7A8494",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
  },

  reloadButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 13,
    backgroundColor: "#0057B8",
  },

  reloadButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
});
