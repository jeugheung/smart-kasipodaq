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
  Modal,
  Pressable,
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

const LOGIN_LOGO = require("../../../assets/icon.png");

export const RegisterPage = ({ navigation, route }: RegisterPageProps) => {
  const { t } = useTranslation();

  const [form, setForm] = useState(initialForm);
  const [profsoyuzList, setProfsoyuzList] = useState<Profsoyuz[]>([]);
  const [isProfsoyuzLoading, setIsProfsoyuzLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const selectedProfsoyuz = useMemo(
    () => profsoyuzList.find(({ id }) => id === form.profsoyuzId) ?? null,
    [profsoyuzList, form.profsoyuzId],
  );

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const parseResponse = async <T,>(response: Response): Promise<T | null> => {
    const text = await response.text();

    if (!text) return null;

    try {
      return JSON.parse(text) as T;
    } catch {
      console.error("Сервер вернул некорректный JSON:", text);
      return null;
    }
  };

  const loadProfsoyuzList = useCallback(async () => {
    try {
      setIsProfsoyuzLoading(true);

      const response = await fetch(API_CONFIG.PROFSOYUZ_LIST_API, {
        headers: { Accept: "application/json" },
      });

      const data = await parseResponse<ProfsoyuzListResponse>(response);

      if (!response.ok || data?.result !== 1) {
        throw new Error(data?.msg || t("registerPage.errors.profsoyuzLoad"));
      }

      setProfsoyuzList(
        (data.profsoyuz ?? []).filter(({ status }) => status === 1),
      );
    } catch (error) {
      console.error("Ошибка загрузки профсоюзов:", error);

      Alert.alert(
        t("registerPage.alerts.errorTitle"),
        error instanceof Error
          ? error.message
          : t("registerPage.errors.profsoyuzLoad"),
      );
    } finally {
      setIsProfsoyuzLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProfsoyuzList();
  }, [loadProfsoyuzList]);

  const handleIinChange = (value: string) => {
    updateField("iin", value.replace(/\D/g, "").slice(0, 12));
  };

  const handlePhoneChange = (value: string) => {
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
    if (!digits.startsWith("7")) digits = `7${digits}`;

    updateField("phone", `+${digits.slice(0, 11)}`);
  };

  const showValidationError = (message: string) => {
    Alert.alert(t("registerPage.alerts.errorTitle"), message);
    return false;
  };

  const validateForm = () => {
    if (!form.lastName.trim()) {
      return showValidationError(t("registerPage.validation.lastNameRequired"));
    }

    if (!form.firstName.trim()) {
      return showValidationError(
        t("registerPage.validation.firstNameRequired"),
      );
    }

    if (!form.middleName.trim()) {
      return showValidationError(
        t("registerPage.validation.middleNameRequired"),
      );
    }

    if (!/^\d{12}$/.test(form.iin)) {
      return showValidationError(t("registerPage.validation.iinLength"));
    }

    const email = form.email.trim();

    if (!email) {
      return showValidationError(t("registerPage.validation.emailRequired"));
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showValidationError(t("registerPage.validation.emailInvalid"));
    }

    if (!/^\+7\d{10}$/.test(form.phone)) {
      return showValidationError(t("registerPage.validation.phoneInvalid"));
    }

    if (form.password.length < 8) {
      return showValidationError(t("registerPage.validation.passwordLength"));
    }

    if (form.password !== form.confirmPassword) {
      return showValidationError(t("registerPage.validation.passwordMismatch"));
    }

    if (!form.profsoyuzId) {
      return showValidationError(
        t("registerPage.validation.profsoyuzRequired"),
      );
    }

    return true;
  };

  const getCurrentUser = async (token: string) => {
    const response = await fetch(API_CONFIG.ME_API, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await parseResponse<MeResponse>(response);

    if (!response.ok) {
      throw new Error(data?.msg || t("registerPage.errors.userLoad"));
    }

    return data;
  };

  const navigateAfterRegistration = () => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "MainTabs",
          params: {
            screen: route.params?.redirectTab ?? "ProfileTab",
          },
        },
      ],
    });
  };

  const handleRegister = async () => {
    if (isSubmitting || !validateForm()) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(API_CONFIG.REGISTER_API, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          last_name: form.lastName.trim(),
          first_name: form.firstName.trim(),
          middle_name: form.middleName.trim(),
          iin: form.iin,
          email: form.email.trim().toLowerCase(),
          phone: form.phone,
          password: form.password,
          profsoyuz_id: form.profsoyuzId,
        }),
      });

      const data = await parseResponse<RegisterResponse>(response);

      if (!response.ok || data?.result !== 1) {
        throw new Error(
          data?.msg || t("registerPage.errors.registrationFailed"),
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
            onPress: () =>
              navigation.replace("LoginPage", {
                redirectTab: route.params?.redirectTab ?? "ProfileTab",
              }),
          },
        ],
      );
    } catch (error) {
      console.error("Ошибка регистрации:", error);

      Alert.alert(
        t("registerPage.alerts.errorTitle"),
        error instanceof Error
          ? error.message
          : t("registerPage.errors.connection"),
      );
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
      <View style={styles.scrollContent}>
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
          <Text style={styles.brandSubtitle}>{t("registerPage.subtitle")}</Text>
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
                  !selectedProfsoyuz && styles.placeholder,
                ]}
                numberOfLines={1}
              >
                {isProfsoyuzLoading
                  ? t("registerPage.profsoyuz.loading")
                  : (selectedProfsoyuz?.name ??
                    t("registerPage.profsoyuz.placeholder"))}
              </Text>

              {isProfsoyuzLoading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <View style={styles.selectArrow} />
              )}
            </TouchableOpacity>

            {!isProfsoyuzLoading && !profsoyuzList.length && (
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

          <PasswordInput
            label={t("registerPage.fields.passwordLabel")}
            placeholder={t("registerPage.fields.passwordPlaceholder")}
            value={form.password}
            error={passwordError}
            visible={isPasswordVisible}
            disabled={isSubmitting}
            onChangeText={(value) => updateField("password", value)}
            onToggle={() => setIsPasswordVisible((current) => !current)}
            visibleText={t("registerPage.fields.hidePassword")}
            hiddenText={t("registerPage.fields.showPassword")}
          />

          <PasswordInput
            label={t("registerPage.fields.confirmPasswordLabel")}
            placeholder={t("registerPage.fields.confirmPasswordPlaceholder")}
            value={form.confirmPassword}
            error={confirmPasswordError}
            visible={isConfirmPasswordVisible}
            disabled={isSubmitting}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
            onChangeText={(value) => updateField("confirmPassword", value)}
            onToggle={() => setIsConfirmPasswordVisible((current) => !current)}
            visibleText={t("registerPage.fields.hidePassword")}
            hiddenText={t("registerPage.fields.showPassword")}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitDisabled && styles.submitButtonDisabled,
            ]}
            activeOpacity={0.85}
            disabled={isSubmitDisabled}
            onPress={handleRegister}
          >
            {isSubmitting ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.loadingText}>
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
      </View>

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
              keyExtractor={({ id }) => String(id)}
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

const FormInput = ({ label, error, style, ...props }: FormInputProps) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>

    <TextInput
      {...props}
      style={[styles.input, !!error && styles.inputError, style]}
      placeholderTextColor={colors.inactive}
      selectionColor={colors.accent}
      autoCorrect={false}
    />

    {!!error && <Text style={styles.validationText}>{error}</Text>}
  </View>
);

type PasswordInputProps = {
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  visible: boolean;
  disabled: boolean;
  visibleText: string;
  hiddenText: string;
  returnKeyType?: "done";
  onChangeText: (value: string) => void;
  onToggle: () => void;
  onSubmitEditing?: () => void;
};

const PasswordInput = ({
  label,
  placeholder,
  value,
  error,
  visible,
  disabled,
  visibleText,
  hiddenText,
  returnKeyType,
  onChangeText,
  onToggle,
  onSubmitEditing,
}: PasswordInputProps) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>

    <View style={[styles.inputWrapper, !!error && styles.inputWrapperError]}>
      <TextInput
        style={styles.inputInside}
        placeholder={placeholder}
        placeholderTextColor={colors.inactive}
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor={colors.accent}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
      />

      <TouchableOpacity
        style={styles.passwordButton}
        activeOpacity={0.7}
        disabled={disabled}
        onPress={onToggle}
      >
        <Text style={styles.passwordButtonText}>
          {visible ? visibleText : hiddenText}
        </Text>
      </TouchableOpacity>
    </View>

    {!!error && <Text style={styles.validationText}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
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
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },

  logo: {
    width: 68,
    height: 68,
  },

  brandName: {
    color: colors.primary,
    fontSize: 26,
    lineHeight: 33,
    fontWeight: "800",
    textAlign: "center",
  },

  brandTitle: {
    marginTop: 13,
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
    paddingTop: 22,
    paddingBottom: 24,
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

  input: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.lightGray,
    color: colors.textDark,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },

  inputError: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerLight,
  },

  inputWrapper: {
    minHeight: 56,
    paddingLeft: 16,
    paddingRight: 10,
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

  inputInside: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    paddingVertical: 12,
    color: colors.textDark,
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

  select: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.lightGray,
  },

  selectText: {
    flex: 1,
    marginRight: 12,
    color: colors.textDark,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },

  placeholder: {
    color: colors.inactive,
  },

  selectArrow: {
    width: 9,
    height: 9,
    marginBottom: 5,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.textLight,
    transform: [{ rotate: "45deg" }],
  },

  retryText: {
    marginTop: 7,
    paddingLeft: 3,
    color: colors.accent,
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
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
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
    textAlign: "center",
  },

  loadingText: {
    marginLeft: 8,
    color: colors.white,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },

  loginBlock: {
    marginTop: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
  },

  loginQuestion: {
    color: colors.textLight,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },

  loginLink: {
    marginLeft: 5,
    color: colors.accent,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },

  modalContent: {
    maxHeight: "76%",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.white,
  },

  modalHandle: {
    width: 44,
    height: 5,
    marginBottom: 15,
    alignSelf: "center",
    borderRadius: 3,
    backgroundColor: colors.border,
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
    color: colors.textDark,
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
    backgroundColor: colors.lightGray,
  },

  closeButtonText: {
    marginTop: -2,
    color: colors.textLight,
    fontSize: 27,
    lineHeight: 29,
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
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.lightGray,
  },

  selectItemActive: {
    borderColor: colors.accent,
    backgroundColor: colors.primaryLight,
  },

  organizationIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.border,
  },

  organizationIconActive: {
    backgroundColor: colors.primaryLight,
  },

  organizationIconText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: "800",
  },

  organizationIconTextActive: {
    color: colors.accent,
  },

  selectItemText: {
    flex: 1,
    marginRight: 12,
    color: colors.textDark,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  selectItemTextActive: {
    color: colors.accent,
    fontWeight: "700",
  },

  radioOuter: {
    width: 21,
    height: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.inactive,
    borderRadius: 11,
  },

  radioOuterActive: {
    borderColor: colors.accent,
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.accent,
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
    backgroundColor: colors.primaryLight,
  },

  emptyIcon: {
    fontSize: 29,
  },

  emptyText: {
    marginTop: 15,
    color: colors.textLight,
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
    backgroundColor: colors.accent,
  },

  reloadButtonText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
});
