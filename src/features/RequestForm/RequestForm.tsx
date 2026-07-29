import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "@shared/api/config";
import { addSolution } from "@shared/api/endpoints";
import { getOrCreateUUID } from "@shared/lib/uuid";
import { colors } from "@shared/theme/colors";
import { AppButton } from "@shared/ui/AppButton";
import { InputWithCounter } from "@shared/ui/InputWithCounter";
import { ToggleSwitch } from "@shared/ui/ToggleSwitch";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { UploadFile, useFileUpload } from "./lib/upload";

type RequestType = "violation" | "work" | "salary" | "social" | "collective";

type FilePickerAction = "gallery" | "files";

type MeResponse = {
  msg?: string;
  result?: number;
  id?: number;
  client?: {
    id: number;
    iin?: string;
    email?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string | null;
  };
  [key: string]: unknown;
};

const TAB_KEYS: RequestType[] = [
  "violation",
  "work",
  "salary",
  "social",
  "collective",
];

export const RequestForm = ({ navigation }: any) => {
  const { t } = useTranslation();

  const { files, uploading, pickFiles, setFiles, uploadSingleFile } =
    useFileUpload();

  const [activeTab, setActiveTab] = useState<RequestType>("violation");

  const [problem, setProblem] = useState("");
  const [contacts, setContacts] = useState("");

  // По умолчанию заявка анонимная
  const [anonymous, setAnonymous] = useState(true);

  // ID авторизованного пользователя для неанонимной заявки
  const [clientId, setClientId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  const [isConsentModalVisible, setIsConsentModalVisible] = useState(false);

  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const [pendingAction, setPendingAction] = useState<FilePickerAction | null>(
    null,
  );

  const parent = navigation.getParent();

  const sheetAnim = useRef(new Animated.Value(400)).current;

  const tabs = useMemo(
    () =>
      TAB_KEYS.map((key) => ({
        key,
        title: t(`requestForm.tabs.${key}`),
      })),
    [t],
  );

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

  /**
   * Проверяет авторизацию и получает ID пользователя.
   * Если токена нет или он недействителен — возвращает null.
   */
  const getAuthorizedClientId = async (): Promise<number | null> => {
    const accessToken = await AsyncStorage.getItem("access_token");

    if (!accessToken) return null;

    const response = await fetch(API_CONFIG.ME_API, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      await AsyncStorage.removeItem("access_token");
      return null;
    }

    const data = await parseResponse<MeResponse>(response);

    if (!response.ok) {
      throw new Error(
        data?.msg ||
          t("requestForm.anonymous.userLoadError", {
            defaultValue: "Не удалось получить данные пользователя",
          }),
      );
    }

    const userId = data?.client?.id ?? data?.id;

    if (!userId) {
      throw new Error(
        t("requestForm.anonymous.userIdMissing", {
          defaultValue: "Сервер не вернул ID пользователя",
        }),
      );
    }

    return userId;
  };

  /**
   * Обрабатывает изменение анонимности.
   *
   * true  — включаем анонимную отправку сразу.
   * false — сначала проверяем авторизацию,
   *         затем показываем согласие на передачу данных.
   */
  const handleAnonymousChange = async (nextValue: boolean) => {
    if (isCheckingUser || loading) return;

    if (nextValue) {
      setAnonymous(true);
      setClientId(null);
      return;
    }

    try {
      setIsCheckingUser(true);

      const userId = await getAuthorizedClientId();

      if (!userId) {
        setAnonymous(true);
        setClientId(null);
        setIsAuthModalVisible(true);
        return;
      }

      setClientId(userId);
      setIsConsentModalVisible(true);
    } catch (error) {
      console.error("Ошибка проверки авторизации пользователя:", error);

      setAnonymous(true);
      setClientId(null);

      Alert.alert(
        t("requestForm.alerts.errorTitle"),
        error instanceof Error
          ? error.message
          : t("requestForm.anonymous.userLoadError", {
              defaultValue: "Не удалось получить данные пользователя",
            }),
      );
    } finally {
      setIsCheckingUser(false);
    }
  };

  const confirmNonAnonymousRequest = () => {
    if (!clientId) {
      setAnonymous(true);
      setIsConsentModalVisible(false);
      return;
    }

    setAnonymous(false);
    setIsConsentModalVisible(false);
  };

  const cancelNonAnonymousRequest = () => {
    setAnonymous(true);
    setClientId(null);
    setIsConsentModalVisible(false);
  };

  const navigateToLogin = () => {
    setIsAuthModalVisible(false);

    if (parent) {
      parent.navigate("LoginPage", {
        redirectTab: "RequestsTab",
      });
      return;
    }

    navigation.navigate("LoginPage", {
      redirectTab: "RequestsTab",
    });
  };

  const openSheet = () => {
    setIsMenuVisible(true);
    sheetAnim.setValue(400);

    requestAnimationFrame(() => {
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeSheet = (nextAction?: FilePickerAction) => {
    if (nextAction) setPendingAction(nextAction);

    Animated.timing(sheetAnim, {
      toValue: 400,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setIsMenuVisible(false));
  };

  const handlePickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== ImagePicker.PermissionStatus.GRANTED) {
        Alert.alert(
          t("requestForm.alerts.errorTitle"),
          t("requestForm.files.galleryPermissionDenied", {
            defaultValue:
              "Доступ к галерее запрещён. Разрешите доступ в настройках телефона.",
          }),
        );

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const timestamp = Date.now();

      const selectedFiles: UploadFile[] = result.assets.map((asset, index) => {
        const originalName =
          asset.fileName || `image_${timestamp}_${index + 1}.jpg`;

        const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, "");

        return {
          uri: asset.uri,
          name: `${nameWithoutExtension}.jpg`,
          type: asset.mimeType || "image/jpeg",
          progress: 0,
        };
      });

      setFiles((currentFiles) => [...currentFiles, ...selectedFiles]);

      selectedFiles.forEach((file) => {
        uploadSingleFile(file).catch((error) => {
          console.error("Ошибка загрузки изображения:", error);
        });
      });
    } catch (error) {
      console.error("Ошибка выбора изображения:", error);

      Alert.alert(
        t("requestForm.alerts.errorTitle"),
        t("requestForm.files.pickImageFailed", {
          defaultValue: "Не удалось выбрать изображение",
        }),
      );
    }
  };

  useEffect(() => {
    if (isMenuVisible || !pendingAction) return;

    const timer = setTimeout(() => {
      if (pendingAction === "gallery") {
        void handlePickImage();
      }

      if (pendingAction === "files") {
        void pickFiles();
      }

      setPendingAction(null);
    }, 150);

    return () => clearTimeout(timer);
  }, [isMenuVisible, pendingAction, pickFiles]);

  const removeFile = (uri: string) => {
    setFiles((currentFiles) => currentFiles.filter((file) => file.uri !== uri));
  };

  const submit = async () => {
    if (!problem.trim()) {
      Alert.alert(
        t("requestForm.alerts.errorTitle"),
        t("requestForm.alerts.problemRequired"),
      );

      return;
    }

    if (uploading) {
      Alert.alert(
        t("requestForm.alerts.errorTitle"),
        t("requestForm.files.waitForUpload", {
          defaultValue: "Дождитесь завершения загрузки файлов",
        }),
      );

      return;
    }

    try {
      setLoading(true);

      let senderIdentifier: string;

      if (anonymous) {
        // Анонимная заявка — отправляем UUID устройства
        senderIdentifier = await getOrCreateUUID();
      } else {
        // Неанонимная заявка — отправляем ID пользователя
        if (!clientId) {
          setAnonymous(true);

          Alert.alert(
            t("requestForm.alerts.errorTitle"),
            t("requestForm.anonymous.userIdMissing", {
              defaultValue:
                "Не удалось определить пользователя. Повторно выберите неанонимную отправку.",
            }),
          );

          return;
        }

        senderIdentifier = String(clientId);
      }

      const payload = {
        type_name: activeTab,
        problem: problem.trim(),
        solution: problem.trim(),
        phone: contacts.trim() || undefined,
        files: files
          .filter((file) => file.serverPath)
          .map((file) => file.serverPath!),

        // Для анонимной заявки — UUID.
        // Для неанонимной заявки — ID пользователя.
        uuid: senderIdentifier,
      };

      console.log("📤 ADD SOLUTION PAYLOAD:", payload);

      await addSolution(payload);

      Alert.alert(
        t("requestForm.alerts.successTitle"),
        t("requestForm.alerts.successMessage"),
      );

      setProblem("");
      setContacts("");
      setAnonymous(true);
      setClientId(null);
      setActiveTab("violation");
      setFiles([]);
    } catch (error: any) {
      console.error("❌ ADD SOLUTION ERROR:", error);

      Alert.alert(
        t("requestForm.alerts.errorTitle"),
        error?.message || t("requestForm.alerts.submitFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled =
    loading || uploading || isCheckingUser || !problem.trim();

  return (
    <View style={styles.content}>
      <View style={styles.tabsWrapper}>
        <Text style={styles.tabsTitle}>{t("requestForm.selectTopic")}</Text>

        <FlatList
          data={tabs}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item }) => {
            const isActive = activeTab === item.key;

            return (
              <Pressable
                onPress={() => setActiveTab(item.key)}
                style={({ pressed }) => [
                  styles.tabButton,
                  isActive && styles.activeTab,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.tabText, isActive && styles.activeTabText]}
                >
                  {item.title}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <InputWithCounter
        value={problem}
        onChangeText={setProblem}
        placeholder={t("requestForm.placeholders.problem")}
        multiline
        maxLength={1000}
      />

      <InputWithCounter
        value={contacts}
        onChangeText={setContacts}
        placeholder={t("requestForm.placeholders.contacts")}
        maxLength={100}
      />

      <Pressable
        onPress={openSheet}
        disabled={loading}
        style={({ pressed }) => [styles.uploadBtn, pressed && styles.pressed]}
      >
        <Text style={styles.uploadText}>{t("requestForm.attachFiles")}</Text>

        {uploading && (
          <ActivityIndicator
            size="small"
            color={colors.accent}
            style={styles.uploadIndicator}
          />
        )}
      </Pressable>

      {files.length > 0 && (
        <View style={styles.fileSection}>
          <View style={styles.fileSectionHeader}>
            <Text style={styles.fileSectionTitle}>
              {t("requestForm.files.title", {
                defaultValue: "Прикреплённые файлы",
              })}
            </Text>

            <Text style={styles.fileCount}>{files.length}</Text>
          </View>

          <View style={styles.fileList}>
            {files.map((file: UploadFile) => {
              const isUploaded = Boolean(file.serverPath);

              const progress = Math.min(Math.max(file.progress || 0, 0), 100);

              return (
                <View
                  key={file.uri}
                  style={[
                    styles.fileCard,
                    isUploaded && styles.fileCardSuccess,
                  ]}
                >
                  <View
                    style={[
                      styles.fileIconWrapper,
                      isUploaded && styles.fileIconWrapperSuccess,
                    ]}
                  >
                    <Text style={styles.fileIcon}>
                      {file.type?.startsWith("image/") ? "🖼️" : "📄"}
                    </Text>
                  </View>

                  <View style={styles.fileInfo}>
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="middle"
                      style={styles.fileName}
                    >
                      {file.name}
                    </Text>

                    <Text
                      style={[
                        styles.fileStatus,
                        isUploaded && styles.fileStatusSuccess,
                      ]}
                    >
                      {isUploaded
                        ? `✓ ${t("requestForm.files.uploaded", {
                            defaultValue: "Загружено",
                          })}`
                        : `${t("requestForm.files.loading", {
                            defaultValue: "Загрузка",
                          })} ${progress}%`}
                    </Text>
                  </View>

                  <View style={styles.fileActions}>
                    {!isUploaded && (
                      <ActivityIndicator size="small" color={colors.accent} />
                    )}

                    <Pressable
                      hitSlop={10}
                      style={styles.removeButton}
                      onPress={() => removeFile(file.uri)}
                    >
                      <Text style={styles.removeIcon}>×</Text>
                    </Pressable>
                  </View>

                  {!isUploaded && (
                    <View
                      style={[styles.progressBar, { width: `${progress}%` }]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.anonBlock}>
        <View style={styles.anonTextBlock}>
          <Text style={styles.anonTitle}>
            {t("requestForm.anonymous.title")}
          </Text>

          <Text style={styles.anonSubtitle}>
            {anonymous
              ? t("requestForm.anonymous.subtitle", {
                  defaultValue:
                    "Ваши данные не будут переданы вместе с заявкой",
                })
              : t("requestForm.anonymous.nonAnonymousSubtitle", {
                  defaultValue: "Ваши данные будут переданы вместе с заявкой",
                })}
          </Text>
        </View>

        <View style={styles.switchContainer}>
          {isCheckingUser && (
            <ActivityIndicator
              size="small"
              color={colors.accent}
              style={styles.switchLoader}
            />
          )}

          <ToggleSwitch value={anonymous} onChange={handleAnonymousChange} />
        </View>
      </View>

      <AppButton
        title={
          loading
            ? t("requestForm.buttons.sending")
            : uploading
              ? t("requestForm.files.uploading", {
                  defaultValue: "Загрузка файлов...",
                })
              : t("requestForm.buttons.submit")
        }
        onPress={submit}
        height={50}
        disabled={isSubmitDisabled}
      />

      {/* Модалка: пользователь не авторизован */}
      <Modal
        visible={isAuthModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsAuthModalVisible(false)}
      >
        <Pressable
          style={styles.confirmOverlay}
          onPress={() => setIsAuthModalVisible(false)}
        >
          <Pressable
            style={styles.confirmModal}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.modalIcon}>
              <Text style={styles.modalIconText}>👤</Text>
            </View>

            <Text style={styles.confirmTitle}>
              {t("requestForm.anonymous.authRequiredTitle", {
                defaultValue: "Требуется авторизация",
              })}
            </Text>

            <Text style={styles.confirmDescription}>
              {t("requestForm.anonymous.authRequiredMessage", {
                defaultValue:
                  "Чтобы отправить заявку не анонимно, необходимо войти в аккаунт.",
              })}
            </Text>

            <View style={styles.confirmActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setIsAuthModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>
                  {t("common.cancel", {
                    defaultValue: "Отмена",
                  })}
                </Text>
              </Pressable>

              <Pressable style={styles.confirmButton} onPress={navigateToLogin}>
                <Text style={styles.confirmButtonText}>
                  {t("requestForm.anonymous.loginButton", {
                    defaultValue: "Войти",
                  })}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Модалка: согласие на передачу данных */}
      <Modal
        visible={isConsentModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={cancelNonAnonymousRequest}
      >
        <Pressable
          style={styles.confirmOverlay}
          onPress={cancelNonAnonymousRequest}
        >
          <Pressable
            style={styles.confirmModal}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.modalIcon}>
              <Text style={styles.modalIconText}>ℹ️</Text>
            </View>

            <Text style={styles.confirmTitle}>
              {t("requestForm.anonymous.consentTitle", {
                defaultValue: "Неанонимная заявка",
              })}
            </Text>

            <Text style={styles.confirmDescription}>
              {t("requestForm.anonymous.consentMessage", {
                defaultValue:
                  "Ваши персональные данные будут переданы вместе с заявкой. Вы согласны продолжить?",
              })}
            </Text>

            <View style={styles.confirmActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={cancelNonAnonymousRequest}
              >
                <Text style={styles.cancelButtonText}>
                  {t("common.cancel", {
                    defaultValue: "Отмена",
                  })}
                </Text>
              </Pressable>

              <Pressable
                style={styles.confirmButton}
                onPress={confirmNonAnonymousRequest}
              >
                <Text style={styles.confirmButtonText}>
                  {t("requestForm.anonymous.agreeButton", {
                    defaultValue: "Согласен",
                  })}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Модалка выбора файла */}
      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => closeSheet()}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.darkBackdrop} onPress={() => closeSheet()} />

          <Animated.View
            style={[
              styles.bottomMenu,
              {
                transform: [{ translateY: sheetAnim }],
              },
            ]}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle}>
                  {t("requestForm.files.modalTitle", {
                    defaultValue: "Прикрепить файл",
                  })}
                </Text>

                <Text style={styles.sheetSubtitle}>
                  {t("requestForm.files.modalSubtitle", {
                    defaultValue: "Выберите источник файла",
                  })}
                </Text>
              </View>

              <Pressable
                hitSlop={10}
                style={styles.sheetCloseButton}
                onPress={() => closeSheet()}
              >
                <Text style={styles.sheetClose}>×</Text>
              </Pressable>
            </View>

            <View style={styles.sheetContent}>
              <Pressable
                onPress={() => closeSheet("gallery")}
                style={({ pressed }) => [
                  styles.sheetItem,
                  pressed && styles.sheetItemPressed,
                ]}
              >
                <View style={styles.sheetItemIcon}>
                  <Text style={styles.sheetItemEmoji}>🖼️</Text>
                </View>

                <View style={styles.sheetItemContent}>
                  <Text style={styles.sheetItemTitle}>
                    {t("requestForm.files.pickFromGallery", {
                      defaultValue: "Выбрать из галереи",
                    })}
                  </Text>

                  <Text style={styles.sheetItemDescription}>
                    {t("requestForm.files.galleryDescription", {
                      defaultValue: "Фотографии и изображения",
                    })}
                  </Text>
                </View>

                <Text style={styles.sheetItemArrow}>›</Text>
              </Pressable>

              <Pressable
                onPress={() => closeSheet("files")}
                style={({ pressed }) => [
                  styles.sheetItem,
                  pressed && styles.sheetItemPressed,
                ]}
              >
                <View style={styles.sheetItemIcon}>
                  <Text style={styles.sheetItemEmoji}>📄</Text>
                </View>

                <View style={styles.sheetItemContent}>
                  <Text style={styles.sheetItemTitle}>
                    {t("requestForm.files.pickFiles", {
                      defaultValue: "Выбрать документ",
                    })}
                  </Text>

                  <Text style={styles.sheetItemDescription}>
                    {t("requestForm.files.filesDescription", {
                      defaultValue: "PDF, Word и другие файлы",
                    })}
                  </Text>
                </View>

                <Text style={styles.sheetItemArrow}>›</Text>
              </Pressable>
            </View>

            <View style={styles.sheetFooter} />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    minHeight: "100%",
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 100,
    gap: 20,
    backgroundColor: colors.background,
  },

  tabsWrapper: {
    marginHorizontal: -15,
    gap: 12,
  },

  tabsContent: {
    paddingHorizontal: 15,
  },

  tabsTitle: {
    paddingLeft: 15,
    color: colors.primary,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "800",
  },

  tabButton: {
    minHeight: 42,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.lightGray,
  },

  activeTab: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },

  tabText: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  activeTabText: {
    color: colors.white,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

  uploadBtn: {
    position: "relative",
    minHeight: 52,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
  },

  uploadText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "800",
  },

  uploadIndicator: {
    position: "absolute",
    right: 17,
  },

  fileSection: {
    gap: 10,
  },

  fileSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  fileSectionTitle: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: "800",
  },

  fileCount: {
    minWidth: 24,
    height: 24,
    marginLeft: 8,
    paddingHorizontal: 7,
    overflow: "hidden",
    color: colors.white,
    fontSize: 12,
    lineHeight: 24,
    fontWeight: "800",
    textAlign: "center",
    borderRadius: 12,
    backgroundColor: colors.accent,
  },

  fileList: {
    gap: 10,
  },

  fileCard: {
    position: "relative",
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 11,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.white,
  },

  fileCardSuccess: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successLight,
  },

  fileIconWrapper: {
    width: 40,
    height: 40,
    marginRight: 11,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  fileIconWrapperSuccess: {
    backgroundColor: colors.successLight,
  },

  fileIcon: {
    fontSize: 19,
  },

  fileInfo: {
    flex: 1,
    minWidth: 0,
  },

  fileName: {
    color: colors.textDark,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },

  fileStatus: {
    marginTop: 3,
    color: colors.textLight,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },

  fileStatusSuccess: {
    color: colors.success,
    fontWeight: "700",
  },

  fileActions: {
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  removeButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.lightGray,
  },

  removeIcon: {
    marginTop: -2,
    color: colors.textLight,
    fontSize: 22,
    lineHeight: 24,
  },

  progressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },

  anonBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  anonTextBlock: {
    flex: 1,
  },

  anonTitle: {
    color: colors.textDark,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "800",
  },

  anonSubtitle: {
    marginTop: 2,
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "500",
  },

  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  switchLoader: {
    marginRight: 10,
  },

  confirmOverlay: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.overlay,
  },

  confirmModal: {
    width: "100%",
    maxWidth: 380,
    padding: 22,
    borderRadius: 22,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },

  modalIcon: {
    width: 58,
    height: 58,
    marginBottom: 15,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    backgroundColor: colors.primaryLight,
  },

  modalIconText: {
    fontSize: 26,
  },

  confirmTitle: {
    color: colors.primary,
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "800",
    textAlign: "center",
  },

  confirmDescription: {
    marginTop: 10,
    color: colors.textLight,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
    textAlign: "center",
  },

  confirmActions: {
    marginTop: 22,
    flexDirection: "row",
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.lightGray,
  },

  cancelButtonText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: "700",
  },

  confirmButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.accent,
  },

  confirmButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  darkBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },

  bottomMenu: {
    overflow: "hidden",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.16,
    shadowRadius: 15,
    elevation: 12,
  },

  sheetHandle: {
    width: 44,
    height: 5,
    marginTop: 10,
    marginBottom: 3,
    alignSelf: "center",
    borderRadius: 3,
    backgroundColor: colors.inactive,
  },

  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },

  sheetHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  sheetTitle: {
    color: colors.primary,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "800",
  },

  sheetSubtitle: {
    marginTop: 3,
    color: colors.textLight,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },

  sheetCloseButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.lightGray,
  },

  sheetClose: {
    marginTop: -2,
    color: colors.textLight,
    fontSize: 25,
    lineHeight: 27,
  },

  sheetContent: {
    paddingHorizontal: 15,
    paddingTop: 15,
    gap: 12,
  },

  sheetItem: {
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.white,
  },

  sheetItemPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
    backgroundColor: colors.lightGray,
  },

  sheetItemIcon: {
    width: 48,
    height: 48,
    marginRight: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },

  sheetItemEmoji: {
    fontSize: 22,
  },

  sheetItemContent: {
    flex: 1,
  },

  sheetItemTitle: {
    color: colors.textDark,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },

  sheetItemDescription: {
    marginTop: 3,
    color: colors.textLight,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },

  sheetItemArrow: {
    marginLeft: 10,
    color: colors.accent,
    fontSize: 30,
    lineHeight: 31,
    fontWeight: "300",
  },

  sheetFooter: {
    height: 34,
  },
});
