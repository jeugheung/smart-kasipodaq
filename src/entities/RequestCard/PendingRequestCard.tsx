import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

import { RequestItem, RequestType } from "./types";

import AnonIcon from "../../../assets/request-card/anon.svg";
import StarIcon from "../../../assets/request-card/start.svg";
import StarFilledIcon from "../../../assets/request-card/star-filled.svg";
import LikeIcon from "../../../assets/request-card/like.svg";
import DislikeIcon from "../../../assets/request-card/dislike.svg";

import { getOrCreateUUID } from "../../shared/lib/uuid";

import { getFavorites, toggleFavorite } from "../../shared/lib/favourites";

import { sendLikeDislike, toggleFavoriteApi } from "../../shared/api/endpoints";

import { colors } from "@shared/theme/colors";

type Props = {
  item: RequestItem;
  requestType: RequestType;
  isFavorite?: boolean;
};

type VoteType = "like" | "dislike";

type StoredVotes = Record<string, VoteType>;

const VOTES_STORAGE_KEY = "@user_votes";

const TYPE_COLOR: Record<RequestType, string> = {
  violation: "#EAF3FF",
  work: "#FFF6D8",
  salary: "#FFF0DF",
  social: "#ECFDF3",
  collective: "#F2EAFE",
};

const normalizeRequestType = (value?: string | null): RequestType => {
  const normalizedValue = String(value ?? "")
    .trim()
    .toLowerCase();

  const typeMap: Record<string, RequestType> = {
    violation: "violation",
    "нарушение тк": "violation",
    "нарушения тк": "violation",

    work: "work",
    "условия труда": "work",
    "условие труда": "work",

    salary: "salary",
    "оплата труда": "salary",

    social: "social",
    "социальные льготы": "social",
    "социальная льгота": "social",

    collective: "collective",
    "предложение по коллективному договору": "collective",
    "предложения по коллективному договору": "collective",
  };

  const normalizedType = typeMap[normalizedValue];

  if (normalizedType) {
    return normalizedType;
  }

  console.warn("⚠️ [UNKNOWN REQUEST TYPE]", {
    originalValue: value,
    normalizedValue,
    fallback: "violation",
  });

  return "violation";
};

const parseStoredVotes = (value: string | null): StoredVotes => {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as StoredVotes;
    }

    console.warn("⚠️ [INVALID VOTES STORAGE FORMAT]", parsed);

    return {};
  } catch (error) {
    console.error("❌ [VOTES STORAGE PARSE ERROR]", {
      value,
      error,
    });

    return {};
  }
};

export const PendingRequestCard = ({
  item,
  requestType,
  isFavorite = false,
}: Props) => {
  const { t } = useTranslation();

  const [expanded, setExpanded] = useState(false);

  const [isStarred, setIsStarred] = useState(isFavorite);

  const [isStarring, setIsStarring] = useState(false);

  const [likesCount, setLikesCount] = useState(
    Number(item.solution_likes) || 0,
  );

  const [dislikesCount, setDislikesCount] = useState(
    Number(item.solution_dislikes) || 0,
  );

  const [userVote, setUserVote] = useState<VoteType | null>(null);

  const [isVoting, setIsVoting] = useState(false);

  const itemTypeName = "type_name" in item ? String(item.type_name ?? "") : "";

  const normalizedRequestType = normalizeRequestType(
    itemTypeName || String(requestType),
  );

  const voteStorageId = `${normalizedRequestType}:${item.id}`;

  useEffect(() => {
    console.log("🧩 [CARD MOUNT / ITEM CHANGED]", {
      itemId: item.id,
      itemIdType: typeof item.id,

      requestTypeFromProps: requestType,

      itemTypeName,

      normalizedRequestType,

      voteStorageId,

      itemStatus: item.status,

      solutionLikesFromApi: item.solution_likes,

      solutionDislikesFromApi: item.solution_dislikes,

      fullItem: item,
    });
  }, [
    item.id,
    item.status,
    item.solution_likes,
    item.solution_dislikes,
    itemTypeName,
    normalizedRequestType,
    requestType,
    voteStorageId,
  ]);

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        console.log("📥 [LOAD PERSISTED DATA START]", {
          itemId: item.id,
          requestType,
          itemTypeName,
          normalizedRequestType,
          voteStorageId,
        });

        const favorites = await getFavorites();

        const favoriteIds = Array.isArray(favorites)
          ? favorites.map(String)
          : [];

        const favoriteFound = favoriteIds.includes(item.id.toString());

        console.log("⭐ [LOAD FAVORITE]", {
          itemId: item.id,
          favorites: favoriteIds,
          favoriteFound,
        });

        setIsStarred(favoriteFound);

        const storedVotesRaw = await AsyncStorage.getItem(VOTES_STORAGE_KEY);

        const votesObj = parseStoredVotes(storedVotesRaw);

        /*
         * Новый ключ:
         * violation:2
         *
         * Старый ключ:
         * 2
         *
         * Старый ключ оставлен как
         * временный fallback для уже
         * сохранённых голосов.
         */
        const savedVote =
          votesObj[voteStorageId] ?? votesObj[item.id.toString()];

        console.log("🗳️ [LOAD SAVED VOTE]", {
          storageKey: VOTES_STORAGE_KEY,

          voteStorageId,

          legacyStorageId: item.id.toString(),

          savedVote,

          allStoredVotes: votesObj,

          rawStorageValue: storedVotesRaw,
        });

        if (savedVote === "like" || savedVote === "dislike") {
          setUserVote(savedVote);
        } else {
          setUserVote(null);
        }
      } catch (error) {
        console.error("❌ [LOAD PERSISTED DATA ERROR]", {
          itemId: item.id,
          requestType,
          itemTypeName,
          normalizedRequestType,
          voteStorageId,
          error,
        });
      }
    };

    void loadPersistedData();
  }, [
    item.id,
    itemTypeName,
    normalizedRequestType,
    requestType,
    voteStorageId,
  ]);

  useEffect(() => {
    const nextLikes = Number(item.solution_likes) || 0;

    const nextDislikes = Number(item.solution_dislikes) || 0;

    console.log("🔄 [SYNC COUNTS FROM ITEM]", {
      itemId: item.id,

      solutionLikesRaw: item.solution_likes,

      solutionDislikesRaw: item.solution_dislikes,

      nextLikes,
      nextDislikes,
    });

    setLikesCount(nextLikes);
    setDislikesCount(nextDislikes);
  }, [item.id, item.solution_likes, item.solution_dislikes]);

  useEffect(() => {
    console.log("🟢 [VOTE STATE CHANGED]", {
      itemId: item.id,
      normalizedRequestType,
      itemStatus: item.status,
      likesCount,
      dislikesCount,
      userVote,
      isVoting,
    });
  }, [
    dislikesCount,
    isVoting,
    item.id,
    item.status,
    likesCount,
    normalizedRequestType,
    userVote,
  ]);

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      console.warn("⚠️ [INVALID DATE]", {
        itemId: item.id,
        dateString,
      });

      return "";
    }

    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const handleStarPress = async () => {
    console.log("⭐ [FAVORITE PRESS]", {
      itemId: item.id,
      isStarred,
      isStarring,
    });

    if (isStarring) {
      console.log("⛔ [FAVORITE BLOCKED]", "Запрос уже выполняется");

      return;
    }

    setIsStarring(true);

    const previousStarred = isStarred;

    const nextStarred = !previousStarred;

    setIsStarred(nextStarred);

    try {
      const uuid = await getOrCreateUUID();

      console.log("📡 [FAVORITE API REQUEST]", {
        uuid,
        itemId: item.id,
        itemIdType: typeof item.id,
        previousStarred,
        nextStarred,
      });

      const response = await toggleFavoriteApi(uuid, item.id);

      console.log("✅ [FAVORITE API RESPONSE]", response);

      await toggleFavorite(item.id.toString());

      const favoritesAfter = await getFavorites();

      console.log("💾 [FAVORITES AFTER]", favoritesAfter);
    } catch (error) {
      setIsStarred(previousStarred);

      console.error("❌ [FAVORITE ERROR]", {
        itemId: item.id,
        previousStarred,
        nextStarred,
        error,
      });
    } finally {
      setIsStarring(false);

      console.log("🏁 [FAVORITE FINALLY]", {
        itemId: item.id,
      });
    }
  };

  const handleVote = async (type: VoteType) => {
    console.log("🟡 [VOTE PRESS]", {
      pressedVote: type,

      itemId: item.id,
      itemIdType: typeof item.id,

      requestTypeFromProps: requestType,

      itemTypeName,

      normalizedRequestType,

      voteStorageId,

      itemStatus: item.status,

      currentUserVote: userVote,

      currentLikes: likesCount,

      currentDislikes: dislikesCount,

      isVoting,

      blockedByNewStatus: item.status === "new",

      blockedByVoting: isVoting,

      blockedByExistingVote: userVote !== null,

      fullItem: item,
    });

    if (item.status === "new") {
      console.log("⛔ [VOTE BLOCKED]", {
        reason: "item.status === new",
        itemId: item.id,
        itemStatus: item.status,
      });

      return;
    }

    if (isVoting) {
      console.log("⛔ [VOTE BLOCKED]", {
        reason: "Запрос уже выполняется",
        itemId: item.id,
      });

      return;
    }

    if (userVote !== null) {
      console.log("⛔ [VOTE BLOCKED]", {
        reason: "Пользователь уже голосовал",
        itemId: item.id,
        savedVote: userVote,
      });

      return;
    }

    setIsVoting(true);

    const previousLikes = likesCount;

    const previousDislikes = dislikesCount;

    setUserVote(type);

    if (type === "like") {
      setLikesCount((previous) => {
        const next = previous + 1;

        console.log("👍 [OPTIMISTIC LIKE UPDATE]", {
          previous,
          next,
        });

        return next;
      });
    } else {
      setDislikesCount((previous) => {
        const next = previous + 1;

        console.log("👎 [OPTIMISTIC DISLIKE UPDATE]", {
          previous,
          next,
        });

        return next;
      });
    }

    try {
      const uuid = await getOrCreateUUID();

      console.log("📡 [VOTE API REQUEST]", {
        category: normalizedRequestType,

        requestTypeFromProps: requestType,

        itemTypeName,

        targetType: "solution",

        uuid,

        solutionId: item.id,

        solutionIdType: typeof item.id,

        status: type,
      });

      const response = await sendLikeDislike(
        normalizedRequestType,
        "solution",
        uuid,
        item.id,
        type,
      );

      console.log("✅ [VOTE API RESPONSE]", {
        response,
        result: response?.result,
        message: response?.msg,
      });

      if (Number(response?.result) !== 1) {
        throw new Error(response?.msg || "Сервер не подтвердил голос");
      }

      const storedVotesBeforeRaw =
        await AsyncStorage.getItem(VOTES_STORAGE_KEY);

      const votesObj = parseStoredVotes(storedVotesBeforeRaw);

      console.log("💾 [VOTES STORAGE BEFORE]", {
        voteStorageId,
        votesObj,
        rawValue: storedVotesBeforeRaw,
      });

      votesObj[voteStorageId] = type;

      /*
       * Удаляем старый ключ только
       * для текущего item.id, чтобы
       * новый формат не конфликтовал
       * со старым.
       */
      if (Object.prototype.hasOwnProperty.call(votesObj, item.id.toString())) {
        delete votesObj[item.id.toString()];
      }

      const nextStorageValue = JSON.stringify(votesObj);

      await AsyncStorage.setItem(VOTES_STORAGE_KEY, nextStorageValue);

      const storedVotesAfterRaw = await AsyncStorage.getItem(VOTES_STORAGE_KEY);

      const storedVotesAfter = parseStoredVotes(storedVotesAfterRaw);

      console.log("💾 [VOTES STORAGE AFTER]", {
        voteStorageId,

        expectedVote: type,

        actualSavedVote: storedVotesAfter[voteStorageId],

        allStoredVotes: storedVotesAfter,

        rawValue: storedVotesAfterRaw,
      });

      console.log("✅ [VOTE COMPLETED]", {
        itemId: item.id,
        category: normalizedRequestType,
        type,

        expectedLikes: type === "like" ? previousLikes + 1 : previousLikes,

        expectedDislikes:
          type === "dislike" ? previousDislikes + 1 : previousDislikes,
      });
    } catch (error) {
      console.error("❌ [VOTE ERROR]", {
        itemId: item.id,

        category: normalizedRequestType,

        requestTypeFromProps: requestType,

        itemTypeName,

        type,

        previousLikes,

        previousDislikes,

        error,
      });

      setUserVote(null);

      setLikesCount(previousLikes);

      setDislikesCount(previousDislikes);

      console.log("↩️ [VOTE ROLLBACK]", {
        restoredLikes: previousLikes,

        restoredDislikes: previousDislikes,

        restoredUserVote: null,
      });
    } finally {
      setIsVoting(false);

      console.log("🏁 [VOTE FINALLY]", {
        itemId: item.id,
        category: normalizedRequestType,
        type,
      });
    }
  };

  const isInteractionDisabled =
    item.status === "new" || isVoting || userVote !== null;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[
          TYPE_COLOR[normalizedRequestType] ?? colors.white,
          colors.white,
        ]}
        locations={[0, 0.9]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 1,
        }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.leftSide}>
          <AnonIcon width={36} height={36} />
        </View>

        <View style={styles.rightSide}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.anon}>
                {t("pendingRequestCard.anonymous")}
              </Text>

              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>

            <Pressable
              onPress={handleStarPress}
              hitSlop={10}
              disabled={isStarring}
              style={styles.starButton}
            >
              {isStarring ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : isStarred ? (
                <StarFilledIcon width={22} height={22} />
              ) : (
                <StarIcon width={22} height={22} />
              )}
            </Pressable>
          </View>

          <Text style={styles.requestTitle}>{item.problem}</Text>

          <Text style={styles.requestSubtitle}>
            {t("pendingRequestCard.solutionOption")}
          </Text>

          <Pressable onPress={() => setExpanded((previous) => !previous)}>
            <Text
              style={styles.requestText}
              numberOfLines={expanded ? undefined : 3}
              ellipsizeMode="tail"
            >
              {item.solution}
            </Text>

            {!expanded && item.solution && item.solution.length > 120 && (
              <Text style={styles.moreTextInline}>
                {t("pendingRequestCard.more", "...ещё")}
              </Text>
            )}
          </Pressable>

          <View style={styles.btnStack}>
            <Pressable
              style={[
                styles.btnItem,

                userVote === "like" && styles.btnActiveLike,

                item.status === "new" && styles.btnDisabled,
              ]}
              onPress={() => handleVote("like")}
              disabled={isInteractionDisabled}
            >
              {isVoting && userVote === "like" ? (
                <ActivityIndicator size="small" color={colors.success} />
              ) : (
                <>
                  <LikeIcon
                    width={18}
                    height={16}
                    fill={
                      userVote === "like" ? colors.success : colors.textLight
                    }
                  />

                  <Text
                    style={[
                      styles.textInactive,

                      userVote === "like" && styles.textActiveLike,
                    ]}
                  >
                    {likesCount}
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.btnItem,

                userVote === "dislike" && styles.btnActiveDislike,

                item.status === "new" && styles.btnDisabled,
              ]}
              onPress={() => handleVote("dislike")}
              disabled={isInteractionDisabled}
            >
              {isVoting && userVote === "dislike" ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <>
                  <DislikeIcon
                    width={18}
                    height={16}
                    fill={
                      userVote === "dislike" ? colors.danger : colors.textLight
                    }
                  />

                  <Text
                    style={[
                      styles.textInactive,

                      userVote === "dislike" && styles.textActiveDislike,
                    ]}
                  >
                    {dislikesCount}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.white,

    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,

    elevation: 2,
  },

  content: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    flexDirection: "row",
    gap: 10,
  },

  leftSide: {
    width: 36,
    height: 36,
  },

  rightSide: {
    flex: 1,
  },

  header: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  anon: {
    color: colors.textDark,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },

  date: {
    color: colors.inactive,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },

  starButton: {
    width: 36,
    height: 36,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  requestTitle: {
    marginTop: 8,
    color: colors.textDark,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  requestSubtitle: {
    marginTop: 10,
    color: colors.textDark,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },

  requestText: {
    marginTop: 3,
    color: colors.textLight,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "400",
  },

  moreTextInline: {
    marginTop: 3,
    color: colors.primary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },

  btnStack: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  btnItem: {
    minWidth: 64,
    height: 36,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  btnDisabled: {
    opacity: 0.55,
  },

  textInactive: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: "600",
  },

  btnActiveLike: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successLight,
  },

  textActiveLike: {
    color: colors.success,
    fontWeight: "700",
  },

  btnActiveDislike: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerLight,
  },

  textActiveDislike: {
    color: colors.danger,
    fontWeight: "700",
  },
});
