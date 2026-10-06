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
  ScrollView,
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

  // Заголовок проблемы
  const [problem, setProblem] = useState("");

  // Описание / решение проблемы
  const [solution, setSolution] = useState("");

  const [contacts, setContacts] = useState("");

  // По умолчанию заявка анонимная
  const [anonymous, setAnonymous] = useState(true);

  // ID авторизованного пользователя
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
   * Переключение анонимности.
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

  /* ================= FILE SHEET ================= */

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
    if (nextAction) {
      setPendingAction(nextAction);
    }

    Animated.timing(sheetAnim, {
      toValue: 400,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsMenuVisible(false);
    });
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

      if (result.canceled || !result.assets?.length) {
        return;
      }

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
    if (isMenuVisible || !pendingAction) {
      return;
    }

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

  /* ================= SUBMIT ================= */

  const submit = async () => {
    if (!problem.trim()) {
      Alert.alert(
        t("requestForm.alerts.errorTitle"),
        t("requestForm.alerts.problemTitleRequired", {
          defaultValue: "Укажите заголовок проблемы",
        }),
      );

      return;
    }

    if (!solution.trim()) {
      Alert.alert(
        t("requestForm.alerts.errorTitle"),
        t("requestForm.alerts.problemRequired", {
          defaultValue: "Опишите проблему",
        }),
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
        senderIdentifier = await getOrCreateUUID();
      } else {
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

        // Заголовок проблемы
        problem: problem.trim(),

        // Полное описание проблемы
        solution: solution.trim(),

        phone: contacts.trim() || undefined,

        files: files
          .filter((file) => file.serverPath)
          .map((file) => file.serverPath!),

        uuid: senderIdentifier,
      };

      console.log("📤 ADD SOLUTION PAYLOAD:", payload);

      await addSolution(payload);

      Alert.alert(
        t("requestForm.alerts.successTitle"),
        t("requestForm.alerts.successMessage"),
      );

      setProblem("");
      setSolution("");
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
    loading ||
    uploading ||
    isCheckingUser ||
    !problem.trim() ||
    !solution.trim();

  /* ================= RENDER ================= */

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      {/* ================= TOPICS ================= */}

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

      {/* ================= ЗАГОЛОВОК ================= */}

      <InputWithCounter
        value={problem}
        onChangeText={setProblem}
        placeholder={t("requestForm.placeholders.problemTitle", {
          defaultValue: "Заголовок проблемы",
        })}
        maxLength={500}
      />

      {/* ================= ОПИСАНИЕ ================= */}

      <InputWithCounter
        value={solution}
        onChangeText={setSolution}
        placeholder={t("requestForm.placeholders.problem", {
          defaultValue: "Опишите проблему",
        })}
        multiline
        maxLength={1000}
      />

      {/* ================= CONTACTS ================= */}

      <InputWithCounter
        value={contacts}
        onChangeText={setContacts}
        placeholder={t("requestForm.placeholders.contacts")}
        maxLength={100}
      />

      {/* ================= FILE BUTTON ================= */}

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

      {/* ================= FILES ================= */}

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
                      style={[
                        styles.progressBar,
                        {
                          width: `${progress}%`,
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ================= ANONYMOUS ================= */}

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

      {/* ================= SUBMIT ================= */}

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

      {/* ================= AUTH MODAL ================= */}

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

      {/* ================= CONSENT MODAL ================= */}

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

      {/* ================= FILE PICKER ================= */}

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
                transform: [
                  {
                    translateY: sheetAnim,
                  },
                ],
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
    </ScrollView>
  );
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,

    // ВАЖНО:
    // запас под кнопкой, чтобы нижний TabBar
    // её не перекрывал
    paddingBottom: 120,

    gap: 16,
  },

  tabsWrapper: {
    gap: 10,
  },

  tabsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },

  tabsContent: {
    gap: 8,
    paddingRight: 16,
  },

  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },

  activeTab: {
    backgroundColor: colors.accent,
  },

  tabText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },

  activeTabText: {
    color: "#FFFFFF",
  },

  pressed: {
    opacity: 0.7,
  },

  uploadBtn: {
    minHeight: 50,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.accent,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 16,
  },

  uploadText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "500",
  },

  uploadIndicator: {
    marginLeft: 10,
  },

  fileSection: {
    gap: 10,
  },

  fileSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  fileSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },

  fileCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    textAlign: "center",
    lineHeight: 24,
    backgroundColor: "#EEF2F7",
    color: "#6B7280",
    fontSize: 12,
  },

  fileList: {
    gap: 8,
  },

  fileCard: {
    minHeight: 64,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },

  fileCardSuccess: {
    borderColor: "#D1FAE5",
  },

  fileIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  fileIconWrapperSuccess: {
    backgroundColor: "#ECFDF5",
  },

  fileIcon: {
    fontSize: 20,
  },

  fileInfo: {
    flex: 1,
    minWidth: 0,
  },

  fileName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1F2937",
  },

  fileStatus: {
    marginTop: 4,
    fontSize: 11,
    color: "#6B7280",
  },

  fileStatusSuccess: {
    color: "#059669",
  },

  fileActions: {
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  removeButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  removeIcon: {
    fontSize: 22,
    color: "#9CA3AF",
  },

  progressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: colors.accent,
  },

  anonBlock: {
    minHeight: 76,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  anonTextBlock: {
    flex: 1,
    paddingRight: 12,
  },

  anonTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },

  anonSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: "#6B7280",
  },

  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  switchLoader: {
    marginRight: 8,
  },

  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  confirmModal: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },

  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  modalIconText: {
    fontSize: 25,
  },

  confirmTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },

  confirmDescription: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
  },

  confirmActions: {
    width: "100%",
    marginTop: 22,
    flexDirection: "row",
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },

  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  confirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  darkBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  bottomMenu: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    marginBottom: 16,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  sheetHeaderText: {
    flex: 1,
  },

  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  sheetSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },

  sheetCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  sheetClose: {
    fontSize: 24,
    lineHeight: 26,
    color: "#6B7280",
  },

  sheetContent: {
    gap: 10,
  },

  sheetItem: {
    minHeight: 72,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    flexDirection: "row",
    alignItems: "center",
  },

  sheetItemPressed: {
    opacity: 0.65,
  },

  sheetItemIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  sheetItemEmoji: {
    fontSize: 22,
  },

  sheetItemContent: {
    flex: 1,
  },

  sheetItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },

  sheetItemDescription: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B7280",
  },

  sheetItemArrow: {
    marginLeft: 8,
    fontSize: 26,
    color: "#9CA3AF",
  },

  sheetFooter: {
    height: 8,
  },
});
