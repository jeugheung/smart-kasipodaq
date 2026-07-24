import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";

import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import { SharedLoader } from "@shared/ui/SharedLoader/SharedLoader";

import {
  RequestItem,
  RequestStatus,
  PendingRequestCard,
  ResolvedRequestCard,
} from "@entities/RequestCard";

import {
  getViolationApproved,
  getViolationFinished,
  getWorkApproved,
  getWorkFinished,
  getSalaryApproved,
  getSalaryFinished,
  getSocialApproved,
  getSocialFinished,
  getCollectiveApproved,
  getCollectiveFinished,
} from "@shared/api/endpoints";

type RequestType = "violation" | "work" | "salary" | "social" | "collective";

const apiMap: Record<
  RequestType,
  {
    pending: () => Promise<any[]>;
    resolved: () => Promise<any[]>;
  }
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

const getLanguageCode = (language: string) => {
  if (language.startsWith("kk")) return "kk";
  if (language.startsWith("en")) return "en";

  return "ru";
};

const getLocalizedField = (
  item: any,
  field: "problem" | "solution" | "comment",
  language: string,
) => {
  const lang = getLanguageCode(language);

  if (field === "problem") {
    if (lang === "kk") {
      return (
        item.problem_kz ||
        item.problem_kk ||
        item.title_kz ||
        item.title_kk ||
        item.problem ||
        item.title ||
        ""
      );
    }

    if (lang === "en") {
      return (
        item.problem_en || item.title_en || item.problem || item.title || ""
      );
    }

    return item.problem_ru || item.title_ru || item.problem || item.title || "";
  }

  if (field === "solution") {
    if (lang === "kk") {
      return (
        item.solution_kz ||
        item.solution_kk ||
        item.description_kz ||
        item.description_kk ||
        item.solution ||
        item.description ||
        ""
      );
    }

    if (lang === "en") {
      return (
        item.solution_en ||
        item.description_en ||
        item.solution ||
        item.description ||
        ""
      );
    }

    return (
      item.solution_ru ||
      item.description_ru ||
      item.solution ||
      item.description ||
      ""
    );
  }

  if (lang === "kk") {
    return item.comment_kz || item.comment_kk || item.comment || "";
  }

  if (lang === "en") {
    return item.comment_en || item.comment || "";
  }

  return item.comment_ru || item.comment || "";
};

export const RequestsList = ({ route }: any) => {
  const { requestType } = route.params as {
    requestType: RequestType;
  };

  const { t, i18n } = useTranslation();

  const language = i18n.resolvedLanguage ?? i18n.language ?? "ru";

  const [activeSegment, setActiveSegment] = useState<RequestStatus>("pending");

  const [requests, setRequests] = useState<RequestItem[]>([]);

  const [loading, setLoading] = useState(false);

  const getRequestTypeTitle = useCallback(
    (type: RequestType) => {
      return t(`requestsList.types.${type}`);
    },
    [t],
  );

  const fetchWithTimeout = async <T,>(
    promise: Promise<T>,
    timeoutMs = 10000,
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs),
      ),
    ]);
  };

  const mapRequest = useCallback(
    (
      item: any,
      segment: RequestStatus,
      fallbackType: RequestType,
    ): RequestItem => {
      const rawType = item.type_name || fallbackType;

      const typeKey: RequestType =
        rawType in apiMap ? (rawType as RequestType) : fallbackType;

      const tag = getRequestTypeTitle(typeKey);

      return {
        id:
          item.id?.toString() ??
          `${fallbackType}-${Date.now()}-${Math.random()}`,

        tag,

        date: item.created_at || item.updated_at || item.date || "",

        problem:
          getLocalizedField(item, "problem", language) ||
          t("requestsList.untitled"),

        solution: getLocalizedField(item, "solution", language),

        comment: getLocalizedField(item, "comment", language),

        status: segment,

        likes: Number(item.solution_likes || item.likes || 0),

        dislikes: Number(item.solution_dislikes || item.dislikes || 0),

        userVote: null,
      };
    },
    [getRequestTypeTitle, language, t],
  );

  const loadRequests = useCallback(
    async (segment: RequestStatus) => {
      setLoading(true);

      try {
        const fetcher = apiMap[requestType][segment];

        const data = await fetchWithTimeout(fetcher(), 10000);

        const safeData = Array.isArray(data) ? data : [];

        const mapped = safeData.map((item) =>
          mapRequest(item, segment, requestType),
        );

        setRequests(mapped);
      } catch (error: any) {
        console.error("Ошибка загрузки заявок:", error);

        if (error?.message === "timeout") {
          Alert.alert(
            t("requestsList.errors.networkTitle"),
            t("requestsList.errors.timeout"),
          );
        } else {
          Alert.alert(
            t("requestsList.errors.title"),
            t("requestsList.errors.loadFailed"),
          );
        }

        setRequests([]);
      } finally {
        setLoading(false);
      }
    },
    [mapRequest, requestType, t],
  );

  useEffect(() => {
    loadRequests(activeSegment);
  }, [activeSegment, loadRequests, language]);

  const handleVote = (id: string, type: "like" | "dislike") => {
    setRequests((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        let newLikes = item.likes;
        let newDislikes = item.dislikes;
        let newVote = item.userVote;

        if (item.userVote === type) {
          newVote = null;

          if (type === "like") {
            newLikes = Math.max(0, newLikes - 1);
          } else {
            newDislikes = Math.max(0, newDislikes - 1);
          }
        } else {
          if (item.userVote === "like") {
            newLikes = Math.max(0, newLikes - 1);
          }

          if (item.userVote === "dislike") {
            newDislikes = Math.max(0, newDislikes - 1);
          }

          newVote = type;

          if (type === "like") {
            newLikes++;
          } else {
            newDislikes++;
          }
        }

        return {
          ...item,
          likes: newLikes,
          dislikes: newDislikes,
          userVote: newVote,
        };
      }),
    );
  };

  return (
    <DefaultLayout variant="back" title={getRequestTypeTitle(requestType)}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeSegment === "pending" && styles.segmentButtonActive,
            ]}
            onPress={() => setActiveSegment("pending")}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === "pending" && styles.segmentTextActive,
              ]}
            >
              {t("requestsList.segments.pending")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeSegment === "resolved" && styles.segmentButtonActive,
            ]}
            onPress={() => setActiveSegment("resolved")}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === "resolved" && styles.segmentTextActive,
              ]}
            >
              {t("requestsList.segments.resolved")}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <SharedLoader visible={loading} />
          </View>
        ) : (
          <View style={styles.listContainer}>
            {requests.map((item) =>
              item.status === "pending" ? (
                <PendingRequestCard
                  key={item.id}
                  item={item}
                  requestType={item.tag}
                  onVote={handleVote}
                />
              ) : item.status === "resolved" ? (
                <ResolvedRequestCard
                  key={item.id}
                  item={item}
                  requestType={item.tag}
                  onVote={handleVote}
                />
              ) : null,
            )}

            {requests.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Text style={styles.emptyIcon}>📭</Text>
                </View>

                <Text style={styles.emptyTitle}>
                  {t("requestsList.empty.title")}
                </Text>

                <Text style={styles.emptyDescription}>
                  {t("requestsList.empty.description")}
                </Text>
              </View>
            )}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },

  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },

  segmentButtonActive: {
    backgroundColor: "#003366",
  },

  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#718096",
    textAlign: "center",
  },

  segmentTextActive: {
    color: "#FFFFFF",
  },

  listContainer: {
    gap: 14,
  },

  loader: {
    paddingVertical: 30,
    alignItems: "center",
  },

  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 34,
    paddingHorizontal: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EBF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyIcon: {
    fontSize: 30,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 8,
  },

  emptyDescription: {
    fontSize: 13,
    color: "#718096",
    textAlign: "center",
    lineHeight: 19,
  },
});
