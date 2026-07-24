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

/**
 * Если assets находится рядом с LoginPage.tsx:
 */
const LOGIN_LOGO = require("../../../assets/splash-icon.png");

/**
 * Если assets находится в корне проекта,
 * замени путь, например:
 *
 * const LOGIN_LOGO = require("../../../assets/splash-icon.png");
 */

export const LoginPage = ({ navigation, route }: LoginPageProps) => {
  const { t } = useTranslation();

  const [iin, setIin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleIinChange = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, "");

    setIin(onlyNumbers.slice(0, 12));
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
          : t("loginPage.errors.connection");

      Alert.alert(t("loginPage.alerts.errorTitle"), message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      t("loginPage.forgotPasswordModal.title"),
      t("loginPage.forgotPasswordModal.message"),
    );
  };

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
                  iin.length > 0 && iin.length < 12 && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder={t("loginPage.fields.iinPlaceholder")}
                  placeholderTextColor="#A7B0C0"
                  value={iin}
                  onChangeText={handleIinChange}
                  keyboardType="number-pad"
                  maxLength={12}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="next"
                  selectionColor="#0057B8"
                />

                <Text style={styles.inputCounter}>{iin.length}/12</Text>
              </View>

              {iin.length > 0 && iin.length < 12 && (
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
                  password.length > 0 &&
                    password.length < 8 &&
                    styles.inputWrapperError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder={t("loginPage.fields.passwordPlaceholder")}
                  placeholderTextColor="#A7B0C0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="done"
                  selectionColor="#0057B8"
                  onSubmitEditing={handleLogin}
                />

                <TouchableOpacity
                  style={styles.passwordButton}
                  activeOpacity={0.7}
                  disabled={isLoading}
                  onPress={() =>
                    setIsPasswordVisible((currentValue) => !currentValue)
                  }
                >
                  <Text style={styles.passwordButtonText}>
                    {isPasswordVisible
                      ? t("loginPage.fields.hidePassword")
                      : t("loginPage.fields.showPassword")}
                  </Text>
                </TouchableOpacity>
              </View>

              {password.length > 0 && password.length < 8 && (
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
              onPress={handleLogin}
              disabled={isSubmitDisabled}
            >
              {isLoading ? (
                <View style={styles.loadingButtonContent}>
                  <ActivityIndicator size="small" color="#FFFFFF" />

                  <Text style={styles.submitButtonText}>
                    {t("loginPage.loggingIn")}
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>
                  {t("loginPage.loginButton")}
                </Text>
              )}
            </TouchableOpacity>

            {/* <TouchableOpacity
              activeOpacity={0.7}
              disabled={isLoading}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>
                {t("loginPage.forgotPassword")}
              </Text>
            </TouchableOpacity> */}
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
    backgroundColor: colors.background || "#F4F7FB",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 42,
    justifyContent: "center",
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
    shadowOpacity: 0.24,
    shadowRadius: 17,
    elevation: 8,
  },

  logo: {
    width: 68,
    height: 68,
  },

  brandTitle: {
    color: "#111827",
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "800",
    textAlign: "center",
  },

  pageTitle: {
    marginTop: 14,
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
    paddingVertical: 22,
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

  inputWrapper: {
    minHeight: 56,
    paddingLeft: 16,
    paddingRight: 12,
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

  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    paddingVertical: 12,
    color: "#172033",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },

  inputCounter: {
    marginLeft: 10,
    color: "#98A2B3",
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

  submitButton: {
    minHeight: 56,
    marginTop: 5,
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
  },

  forgotPasswordText: {
    marginTop: 18,
    color: "#0057B8",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  registrationBlock: {
    marginTop: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
  },

  registrationDescription: {
    color: "#7A8494",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },

  registrationLink: {
    marginLeft: 5,
    color: "#0057B8",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },
});
