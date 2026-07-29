import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { API_CONFIG } from "@shared/api/config";
import { RootStackParamList } from "@shared/navigation/types";
import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
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

const LOGIN_LOGO = require("../../../assets/icon.png");

export const LoginPage = ({ navigation, route }: LoginPageProps) => {
  const { t } = useTranslation();

  const [iin, setIin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleIinChange = (value: string) => {
    setIin(value.replace(/\D/g, "").slice(0, 12));
  };

  const validateForm = (): boolean => {
    if (!iin) {
      Alert.alert(
        t("loginPage.alerts.errorTitle"),
        t("loginPage.validation.iinRequired"),
      );
      return false;
    }

    if (!/^\d{12}$/.test(iin)) {
      Alert.alert(
        t("loginPage.alerts.errorTitle"),
        t("loginPage.validation.iinLength"),
      );
      return false;
    }

    if (!password.trim()) {
      Alert.alert(
        t("loginPage.alerts.errorTitle"),
        t("loginPage.validation.passwordRequired"),
      );
      return false;
    }

    if (password.trim().length < 8) {
      Alert.alert(
        t("loginPage.alerts.errorTitle"),
        t("loginPage.validation.passwordLength"),
      );
      return false;
    }

    return true;
  };

  const parseResponse = async <T,>(response: Response): Promise<T | null> => {
    const responseText = await response.text();

    if (!responseText) return null;

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

      if (response.status === 401 || response.status === 403) {
        throw new Error(t("loginPage.errors.invalidSession"));
      }

      throw new Error(
        typeof data?.msg === "string"
          ? data.msg
          : t("loginPage.errors.userLoad"),
      );
    }

    if (data?.result !== 1) {
      throw new Error(data?.msg || t("loginPage.errors.userLoad"));
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
          params: { screen: redirectTab },
        },
      ],
    });
  };

  const handleLogin = async () => {
    if (isLoading || !validateForm()) return;

    try {
      setIsLoading(true);

      const response = await fetch(API_CONFIG.LOGIN_API, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ iin, password }),
      });

      const data = await parseResponse<LoginResponse>(response);

      if (!response.ok) {
        const errorMessage =
          response.status === 401
            ? t("loginPage.errors.invalidCredentials")
            : data?.msg || t("loginPage.errors.loginFailed");

        Alert.alert(t("loginPage.alerts.authErrorTitle"), errorMessage);
        return;
      }

      if (!data) {
        Alert.alert(
          t("loginPage.alerts.errorTitle"),
          t("loginPage.errors.emptyResponse"),
        );
        return;
      }

      if (data.result !== 1) {
        Alert.alert(
          t("loginPage.alerts.authErrorTitle"),
          data.msg || t("loginPage.errors.loginFailed"),
        );
        return;
      }

      if (!data.access_token) {
        Alert.alert(
          t("loginPage.alerts.errorTitle"),
          t("loginPage.errors.tokenMissing"),
        );
        return;
      }

      const accessToken = data.access_token;

      await AsyncStorage.setItem("access_token", accessToken);

      try {
        const currentUser = await getCurrentUser(accessToken);

        console.log("Текущий пользователь:", currentUser);
      } catch (error) {
        await AsyncStorage.removeItem("access_token");
        throw error;
      }

      handleSuccessfulLogin();
    } catch (error) {
      console.error("Ошибка входа:", error);

      const message =
        error instanceof Error
          ? error.message
          : t("loginPage.errors.connection");

      Alert.alert(t("loginPage.alerts.errorTitle"), message);
    } finally {
      setIsLoading(false);
    }
  };

  const isIinInvalid = iin.length > 0 && iin.length < 12;

  const isPasswordInvalid = password.length > 0 && password.length < 8;

  const isSubmitDisabled =
    isLoading || iin.length !== 12 || password.trim().length < 8;

  const remainingIinDigits = 12 - iin.length;

  return (
    <DefaultLayout
      variant="back"
      onRightPress={() =>
        Alert.alert(
          t("loginPage.language.title"),
          t("loginPage.language.message"),
        )
      }
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
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

            <Text style={styles.brandTitle}>Smart Kasipodaq</Text>

            <Text style={styles.pageTitle}>{t("loginPage.title")}</Text>

            <Text style={styles.brandSubtitle}>{t("loginPage.subtitle")}</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {t("loginPage.fields.iinLabel")}
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  isIinInvalid && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder={t("loginPage.fields.iinPlaceholder")}
                  placeholderTextColor={colors.inactive}
                  value={iin}
                  onChangeText={handleIinChange}
                  keyboardType="number-pad"
                  maxLength={12}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="next"
                  selectionColor={colors.accent}
                />

                <Text style={styles.inputCounter}>{iin.length}/12</Text>
              </View>

              {isIinInvalid && (
                <Text style={styles.validationText}>
                  {t("loginPage.validation.remainingDigits", {
                    count: remainingIinDigits,
                  })}
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {t("loginPage.fields.passwordLabel")}
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  isPasswordInvalid && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder={t("loginPage.fields.passwordPlaceholder")}
                  placeholderTextColor={colors.inactive}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="done"
                  selectionColor={colors.accent}
                  onSubmitEditing={handleLogin}
                />

                <TouchableOpacity
                  style={styles.passwordButton}
                  activeOpacity={0.7}
                  disabled={isLoading}
                  onPress={() => setIsPasswordVisible((current) => !current)}
                >
                  <Text style={styles.passwordButtonText}>
                    {isPasswordVisible
                      ? t("loginPage.fields.hidePassword")
                      : t("loginPage.fields.showPassword")}
                  </Text>
                </TouchableOpacity>
              </View>

              {isPasswordInvalid && (
                <Text style={styles.validationText}>
                  {t("loginPage.validation.passwordShort")}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitDisabled && styles.submitButtonDisabled,
              ]}
              activeOpacity={0.85}
              disabled={isSubmitDisabled}
              onPress={handleLogin}
            >
              {isLoading ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="small" color={colors.white} />

                  <Text style={styles.loadingText}>
                    {t("loginPage.loggingIn")}
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>
                  {t("loginPage.loginButton")}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.registrationBlock}>
            <Text style={styles.registrationDescription}>
              {t("loginPage.noAccount")}
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isLoading}
              onPress={() =>
                navigation.navigate("RegisterPage", {
                  redirectTab: route.params?.redirectTab,
                })
              }
            >
              <Text style={styles.registrationLink}>
                {t("loginPage.registration")}
              </Text>
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
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 42,
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
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 17,
    elevation: 8,
  },

  logo: {
    width: 68,
    height: 68,
  },

  brandTitle: {
    color: colors.primary,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "800",
    textAlign: "center",
  },

  pageTitle: {
    marginTop: 14,
    color: colors.textDark,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "800",
    textAlign: "center",
  },

  brandSubtitle: {
    maxWidth: 320,
    marginTop: 7,
    color: colors.textLight,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  formCard: {
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 7 },
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
    color: colors.textDark,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },

  inputWrapper: {
    minHeight: 56,
    paddingLeft: 16,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.lightGray,
  },

  inputWrapperError: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerLight,
  },

  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    paddingVertical: 12,
    color: colors.textDark,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },

  inputCounter: {
    marginLeft: 10,
    color: colors.textLight,
    fontSize: 12,
    fontWeight: "600",
  },

  passwordButton: {
    minHeight: 40,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  passwordButtonText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },

  validationText: {
    marginTop: 6,
    paddingLeft: 3,
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },

  submitButton: {
    minHeight: 56,
    marginTop: 5,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },

  submitButtonDisabled: {
    backgroundColor: colors.inactive,
    shadowOpacity: 0,
    elevation: 0,
  },

  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },

  loadingText: {
    marginLeft: 8,
    color: colors.white,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },

  registrationBlock: {
    marginTop: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
  },

  registrationDescription: {
    color: colors.textLight,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },

  registrationLink: {
    marginLeft: 5,
    color: colors.accent,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },
});
