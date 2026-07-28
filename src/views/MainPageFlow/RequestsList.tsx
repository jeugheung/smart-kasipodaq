import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import { SharedLoader } from "@shared/ui/SharedLoader/SharedLoader";

import {
  PendingRequestCard,
  RequestItem,
  RequestStatus,
  ResolvedRequestCard,
} from "@entities/RequestCard";

import {
  getCollectiveApproved,
  getCollectiveFinished,
  getSalaryApproved,
  getSalaryFinished,
  getSocialApproved,
  getSocialFinished,
  getViolationApproved,
  getViolationFinished,
  getWorkApproved,
  getWorkFinished,
} from "@shared/api/endpoints";

type RequestType =
  | "violation"
  | "work"
  | "salary"
  | "social"
  | "collective";

type ApiRequestItem = Record<string, any>;

const apiMap: Record<
  RequestType,
  Record<RequestStatus, () => Promise<ApiRequestItem[]>>
> = {
  violation: {
    pending: getViolationApproved,
    resolved: getViolationFinished,
  },
  work: {
    pending: getWorkApproved,
    resolved: getWorkFinished,
  },
  salary: {
    pending: getSalaryApproved,
    resolved: getSalaryFinished,
  },
  social: {
    pending: getSocialApproved,
    resolved: getSocialFinished,
  },
  collective: {
    pending: getCollectiveApproved,
    resolved: getCollectiveFinished,
  },
};

const normalizeLanguage = (language: string) => {
  if (language.startsWith("kk") || language.startsWith("kz")) return "kk";
  if (language.startsWith("en")) return "en";
  return "ru";
};

const getLocalizedValue = (
  item: ApiRequestItem,
  field: "problem" | "solution" | "comment",
  language: string,
) => {
  const lang = normalizeLanguage(language);

  const keys: Record<typeof field, Record<string, string[]>> = {
    problem: {
      ru: ["problem_ru", "title_ru", "problem", "title"],
      kk: [
        "problem_kz",
        "problem_kk",
        "title_kz",
        "title_kk",
        "problem",
        "title",
      ],
      en: ["problem_en", "title_en", "problem", "title"],
    },
    solution: {
      ru: [
        "solution_ru",
        "description_ru",
        "solution",
        "description",
      ],
      kk: [
        "solution_kz",
        "solution_kk",
        "description_kz",
        "description_kk",
        "solution",
        "description",
      ],
      en: [
        "solution_en",
        "description_en",
        "solution",
        "description",
      ],
    },
    comment: {
      ru: ["comment_ru", "comment"],
      kk: ["comment_kz", "comment_kk", "comment"],
      en: ["comment_en", "comment"],
    },
  };

  return keys[field][lang]
    .map((key) => item[key])
    .find((value) => value !== undefined && value !== null && value !== "");
};

const getUserVote = (
  item: ApiRequestItem,
): "like" | "dislike" | null => {
  const vote =
    item.userVote ??
    item.user_vote ??
    item.vote ??
    item.user_status ??
    null;

  if (vote === "like" || vote === 1 || vote === "1") return "like";
  if (vote === "dislike" || vote === -1 || vote === "-1") {
    return "dislike";
  }

  return null;
};

const withTimeout = <T,>(
  promise: Promise<T>,
  timeout = 10000,
): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), timeout),
    ),
  ]);

export const RequestsList = ({ route }: any) => {
  const { requestType } = route.params as {
    requestType: RequestType;
  };

  const { t, i18n } = useTranslation();

  const language =
    i18n.resolvedLanguage || i18n.language || "ru";

  const [activeSegment, setActiveSegment] =
    useState<RequestStatus>("pending");

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const title = t(`requestsList.types.${requestType}`);

  const mapRequest = useCallback(
    (
      item: ApiRequestItem,
      status: RequestStatus,
    ): RequestItem => {
      const rawType = item.type_name || requestType;

      const typeName: RequestType =
        rawType in apiMap ? rawType : requestType;

      return {
        // Важно: не удаляем исходные поля API
        ...item,

        id: String(item.id),

        type_name: typeName,

        tag: t(`requestsList.types.${typeName}`),

        date:
          item.created_at ||
          item.updated_at ||
          item.date ||
          "",

        problem:
          getLocalizedValue(item, "problem", language) ||
          t("requestsList.untitled"),

        solution:
          getLocalizedValue(item, "solution", language) || "",

        comment:
          getLocalizedValue(item, "comment", language) || "",

        status,

        likes: Number(
          item.solution_likes ??
            item.likes_count ??
            item.likes ??
            0,
        ),

        dislikes: Number(
          item.solution_dislikes ??
            item.dislikes_count ??
            item.dislikes ??
            0,
        ),

        userVote: getUserVote(item),
      };
    },
    [language, requestType, t],
  );

  const loadRequests = useCallback(async () => {
    setLoading(true);

    try {
      const response = await withTimeout(
        apiMap[requestType][activeSegment](),
      );

      const data = Array.isArray(response) ? response : [];

      console.log("📦 [REQUEST LIST RAW]", {
        requestType,
        activeSegment,
        data,
      });

      const mapped = data.map((item) =>
        mapRequest(item, activeSegment),
      );

      console.log("✅ [REQUEST LIST MAPPED]", mapped);

      setRequests(mapped);
    } catch (error: any) {
      console.error("❌ [REQUEST LIST ERROR]", error);

      Alert.alert(
        t("requestsList.errors.title"),
        error?.message === "timeout"
          ? t("requestsList.errors.timeout")
          : t("requestsList.errors.loadFailed"),
      );

      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [activeSegment, mapRequest, requestType, t]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const renderSegment = (
    status: RequestStatus,
    label: string,
  ) => {
    const active = activeSegment === status;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.segmentButton,
          active && styles.segmentButtonActive,
        ]}
        onPress={() => setActiveSegment(status)}
      >
        <Text
          style={[
            styles.segmentText,
            active && styles.segmentTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <DefaultLayout variant="back" title={title}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.segmentedContainer}>
          {renderSegment(
            "pending",
            t("requestsList.segments.pending"),
          )}

          {renderSegment(
            "resolved",
            t("requestsList.segments.resolved"),
          )}
        </View>

        {loading ? (
          <View style={styles.loader}>
            <SharedLoader visible />
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>

            <Text style={styles.emptyTitle}>
              {t("requestsList.empty.title")}
            </Text>

            <Text style={styles.emptyDescription}>
              {t("requestsList.empty.description")}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {requests.map((item) => {
              const commonProps = {
                key: item.id,
                item,
                requestType:
                  (item as any).type_name || requestType,
              };

              return item.status === "resolved" ? (
                <ResolvedRequestCard {...commonProps} />
              ) : (
                <PendingRequestCard {...commonProps} />
              );
            })}
          </View>
        )}
      </ScrollView>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: colors.background,
  },

  content: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },

  segmentedContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },

  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },

  segmentButtonActive: {
    backgroundColor: "#003366",
  },

  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#718096",
  },

  segmentTextActive: {
    color: "#FFFFFF",
  },

  listContainer: {
    gap: 14,
  },

  loader: {
    paddingVertical: 40,
    alignItems: "center",
  },

  emptyState: {
    padding: 32,
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },

  emptyIcon: {
    fontSize: 34,
    marginBottom: 14,
  },

  emptyTitle: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#1A202C",
  },

  emptyDescription: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: "#718096",
  },
});