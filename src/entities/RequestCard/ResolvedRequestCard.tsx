import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { RequestItem, RequestType } from "./types";

import AnonIcon from "../../../assets/request-card/anon.svg";
import SolutionIcon from "../../../assets/request-card/solution2.svg";
import StarIcon from "../../../assets/request-card/start.svg";
import StarFilledIcon from "../../../assets/request-card/star-filled.svg";
import LikeIcon from "../../../assets/request-card/like.svg";
import DislikeIcon from "../../../assets/request-card/dislike.svg";

import { toggleFavorite, getFavorites } from "../../shared/lib/favourites";
import { getOrCreateUUID } from "../../shared/lib/uuid";
import { sendLikeDislike, toggleFavoriteApi } from "../../shared/api/endpoints";

type Props = {
  item: RequestItem;
  requestType: RequestType;
  isFavorite?: boolean;
};

type VoteType = "like" | "dislike";

const VOTES_STORAGE_KEY = "@user_resolved_votes";

const TYPE_COLOR: Record<RequestType, string> = {
  violation: "#EAF3FF",
  work: "#FFF6D8",
  salary: "#FFF0DF",
  social: "#ECFDF3",
  collective: "#F2EAFE",
};

export const ResolvedRequestCard = ({
  item,
  requestType,
  isFavorite = false,
}: Props) => {
  const { t } = useTranslation();

  const [expandedQ, setExpandedQ] = useState(false);
  const [expandedA, setExpandedA] = useState(false);

  // Избранное
  const [isStarred, setIsStarred] = useState(isFavorite);
  const [isStarring, setIsStarring] = useState(false);

  // Лайки вопроса / решения
  const [qLikes, setQLikes] = useState(Number(item.solution_likes) || 0);

  const [qDislikes, setQDislikes] = useState(
    Number(item.solution_dislikes) || 0,
  );

  const [userVoteQ, setUserVoteQ] = useState<VoteType | null>(null);

  const [isVotingQ, setIsVotingQ] = useState(false);

  // Лайки ответа / комментария
  const [aLikes, setALikes] = useState(Number(item.comment_likes) || 0);

  const [aDislikes, setADislikes] = useState(
    Number(item.comment_dislikes) || 0,
  );

  const [userVoteA, setUserVoteA] = useState<VoteType | null>(null);

  const [isVotingA, setIsVotingA] = useState(false);

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const favorites = await getFavorites();

        setIsStarred(isFavorite || favorites.includes(item.id.toString()));

        const stored = await AsyncStorage.getItem(VOTES_STORAGE_KEY);

        if (!stored) return;

        const votes = JSON.parse(stored);

        setUserVoteQ(votes[`${item.id}_Q`] || null);
        setUserVoteA(votes[`${item.id}_A`] || null);
      } catch (error) {
        console.error("Ошибка загрузки сохранённых голосов:", error);
      }
    };

    loadPersistedData();
  }, [item.id, isFavorite]);

  useEffect(() => {
    setQLikes(Number(item.solution_likes) || 0);
    setQDislikes(Number(item.solution_dislikes) || 0);
    setALikes(Number(item.comment_likes) || 0);
    setADislikes(Number(item.comment_dislikes) || 0);
  }, [
    item.solution_likes,
    item.solution_dislikes,
    item.comment_likes,
    item.comment_dislikes,
  ]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const handleStarPress = async () => {
    if (isStarring) return;

    setIsStarring(true);

    const previousValue = isStarred;

    setIsStarred(!previousValue);

    try {
      const uuid = await getOrCreateUUID();

      await toggleFavoriteApi(uuid, item.id);
      await toggleFavorite(item.id.toString());
    } catch (error) {
      console.error("Ошибка изменения избранного:", error);

      setIsStarred(previousValue);
    } finally {
      setIsStarring(false);
    }
  };

  const saveVoteToStorage = async (suffix: "_Q" | "_A", type: VoteType) => {
    const stored = await AsyncStorage.getItem(VOTES_STORAGE_KEY);

    const votes = stored ? JSON.parse(stored) : {};

    votes[`${item.id}${suffix}`] = type;

    await AsyncStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votes));
  };

  const handleVoteQ = async (type: VoteType) => {
    if (isVotingQ || userVoteQ) return;

    setIsVotingQ(true);
    setUserVoteQ(type);

    if (type === "like") {
      setQLikes((previous) => previous + 1);
    } else {
      setQDislikes((previous) => previous + 1);
    }

    try {
      const uuid = await getOrCreateUUID();

      console.log("📡 [API Q]", {
        requestType,
        targetType: "solution",
        uuid,
        itemId: item.id,
        status: type,
      });

      await sendLikeDislike(requestType, "solution", uuid, item.id, type);

      await saveVoteToStorage("_Q", type);
    } catch (error) {
      console.error("❌ Vote Q Error:", error);

      setUserVoteQ(null);

      if (type === "like") {
        setQLikes((previous) => Math.max(0, previous - 1));
      } else {
        setQDislikes((previous) => Math.max(0, previous - 1));
      }
    } finally {
      setIsVotingQ(false);
    }
  };

  const handleVoteA = async (type: VoteType) => {
    if (isVotingA || userVoteA) return;

    setIsVotingA(true);
    setUserVoteA(type);

    if (type === "like") {
      setALikes((previous) => previous + 1);
    } else {
      setADislikes((previous) => previous + 1);
    }

    try {
      const uuid = await getOrCreateUUID();

      console.log("📡 [API A]", {
        requestType,
        targetType: "comment",
        uuid,
        itemId: item.id,
        status: type,
      });

      await sendLikeDislike(requestType, "comment", uuid, item.id, type);

      await saveVoteToStorage("_A", type);
    } catch (error) {
      console.error("❌ Vote A Error:", error);

      setUserVoteA(null);

      if (type === "like") {
        setALikes((previous) => Math.max(0, previous - 1));
      } else {
        setADislikes((previous) => Math.max(0, previous - 1));
      }
    } finally {
      setIsVotingA(false);
    }
  };

  const isQDisabled = isVotingQ || userVoteQ !== null;
  const isADisabled = isVotingA || userVoteA !== null;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[TYPE_COLOR[requestType] || "#FFFFFF", "#FFFFFF"]}
        locations={[0, 0.7]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Вопрос / решение */}
        <View style={styles.sectionRow}>
          <View style={styles.leftSide}>
            <AnonIcon width={36} height={36} />
          </View>

          <View style={styles.rightSide}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.anon}>
                  {t("pendingRequestCard.anonymous", "Анонимно")}
                </Text>

                <Text style={styles.date}>{formatDate(item.created_at)}</Text>
              </View>

              <Pressable
                onPress={handleStarPress}
                hitSlop={10}
                disabled={isStarring}
                style={isStarring && styles.starDisabled}
              >
                {isStarred ? (
                  <StarFilledIcon width={22} height={22} />
                ) : (
                  <StarIcon width={22} height={22} />
                )}
              </Pressable>
            </View>

            <Text style={styles.requestTitle}>{item.problem}</Text>

            <Pressable onPress={() => setExpandedQ((previous) => !previous)}>
              <Text
                style={styles.text}
                numberOfLines={expandedQ ? undefined : 3}
              >
                {item.solution}
              </Text>

              {!expandedQ &&
                Boolean(item.solution) &&
                item.solution.length > 120 && (
                  <Text style={styles.moreTextInline}>
                    {t("pendingRequestCard.more", "...ещё")}
                  </Text>
                )}
            </Pressable>

            <View style={styles.btnStack}>
              <Pressable
                style={[
                  styles.btnItem,
                  userVoteQ === "like" && styles.btnActiveLike,
                  isQDisabled && styles.btnDisabled,
                ]}
                onPress={() => handleVoteQ("like")}
                disabled={isQDisabled}
              >
                {isVotingQ && userVoteQ === "like" ? (
                  <ActivityIndicator size="small" color="#2E7D32" />
                ) : (
                  <>
                    <LikeIcon
                      width={18}
                      height={16}
                      fill={userVoteQ === "like" ? "#2E7D32" : "#FFFFFF"}
                    />

                    <Text
                      style={[
                        styles.textInactive,
                        userVoteQ === "like" && styles.textActiveLike,
                      ]}
                    >
                      {qLikes}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={[
                  styles.btnItem,
                  userVoteQ === "dislike" && styles.btnActiveDislike,
                  isQDisabled && styles.btnDisabled,
                ]}
                onPress={() => handleVoteQ("dislike")}
                disabled={isQDisabled}
              >
                {isVotingQ && userVoteQ === "dislike" ? (
                  <ActivityIndicator size="small" color="#D32F2F" />
                ) : (
                  <>
                    <DislikeIcon
                      width={18}
                      height={16}
                      fill={userVoteQ === "dislike" ? "#D32F2F" : "#FFFFFF"}
                    />

                    <Text
                      style={[
                        styles.textInactive,
                        userVoteQ === "dislike" && styles.textActiveDislike,
                      ]}
                    >
                      {qDislikes}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* Ответ администрации */}
        <View style={styles.sectionRow}>
          <View style={styles.leftSide}>
            <SolutionIcon width={36} height={36} />
          </View>

          <View style={styles.rightSide}>
            <View style={styles.headerLeftA}>
              <Text style={styles.solution}>
                {t(
                  "resolvedRequestCard.solutionAuthor",
                  "Решение Администрации",
                )}
              </Text>

              <Text style={styles.date}>{formatDate(item.updated_at)}</Text>
            </View>

            <Pressable onPress={() => setExpandedA((previous) => !previous)}>
              <Text
                style={styles.text}
                numberOfLines={expandedA ? undefined : 3}
              >
                {item.comment}
              </Text>

              {!expandedA &&
                Boolean(item.comment) &&
                item.comment.length > 120 && (
                  <Text style={styles.moreTextInline}>
                    {t("pendingRequestCard.more", "...ещё")}
                  </Text>
                )}
            </Pressable>

            <View style={styles.btnStack}>
              <Pressable
                style={[
                  styles.btnItem,
                  userVoteA === "like" && styles.btnActiveLike,
                  isADisabled && styles.btnDisabled,
                ]}
                onPress={() => handleVoteA("like")}
                disabled={isADisabled}
              >
                {isVotingA && userVoteA === "like" ? (
                  <ActivityIndicator size="small" color="#2E7D32" />
                ) : (
                  <>
                    <LikeIcon
                      width={18}
                      height={16}
                      fill={userVoteA === "like" ? "#2E7D32" : "#FFFFFF"}
                    />

                    <Text
                      style={[
                        styles.textInactive,
                        userVoteA === "like" && styles.textActiveLike,
                      ]}
                    >
                      {aLikes}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={[
                  styles.btnItem,
                  userVoteA === "dislike" && styles.btnActiveDislike,
                  isADisabled && styles.btnDisabled,
                ]}
                onPress={() => handleVoteA("dislike")}
                disabled={isADisabled}
              >
                {isVotingA && userVoteA === "dislike" ? (
                  <ActivityIndicator size="small" color="#D32F2F" />
                ) : (
                  <>
                    <DislikeIcon
                      width={18}
                      height={16}
                      fill={userVoteA === "dislike" ? "#D32F2F" : "#FFFFFF"}
                    />

                    <Text
                      style={[
                        styles.textInactive,
                        userVoteA === "dislike" && styles.textActiveDislike,
                      ]}
                    >
                      {aDislikes}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
  },

  content: {
    padding: 16,
    gap: 24,
  },

  sectionRow: {
    flexDirection: "row",
    gap: 12,
  },

  leftSide: {
    width: 36,
    alignItems: "center",
  },

  rightSide: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  headerLeft: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  headerLeftA: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 6,
  },

  anon: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  date: {
    fontSize: 14,
    color: "#999999",
  },

  requestTitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
    marginBottom: 4,
    color: "#1F2937",
  },

  solution: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  text: {
    fontSize: 12,
    lineHeight: 20,
    color: "#374151",
  },

  moreTextInline: {
    color: "#838282",
    fontWeight: "600",
    fontSize: 12,
    marginTop: 2,
  },

  btnStack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },

  btnItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 100,
  },

  btnDisabled: {
    opacity: 0.6,
  },

  starDisabled: {
    opacity: 0.6,
  },

  textInactive: {
    fontWeight: "600",
    color: "#666666",
    fontSize: 13,
  },

  btnActiveLike: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
  },

  textActiveLike: {
    color: "#2E7D32",
    fontWeight: "700",
  },

  btnActiveDislike: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },

  textActiveDislike: {
    color: "#D32F2F",
    fontWeight: "700",
  },
});
