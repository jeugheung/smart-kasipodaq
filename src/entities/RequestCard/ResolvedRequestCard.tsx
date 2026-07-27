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

import { RequestItem, RequestType } from "./RequestCard.types";

import AnonIcon from "../../../assets/request-card/anon.svg";
import SolutionIcon from "../../../assets/request-card/solution1.svg";
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
type VoteSuffix = "_Q" | "_A";

const VOTES_STORAGE_KEY = "@user_resolved_votes";

const TYPE_COLOR: Record<RequestType, string> = {
  violation: "#EAF3FF",
  work: "#FFF6D8",
  salary: "#FFF0DF",
  social: "#ECFDF3",
  collective: "#F2EAFE",
};

const TYPE_ACCENT: Record<RequestType, string> = {
  violation: "#2563EB",
  work: "#D97706",
  salary: "#EA580C",
  social: "#16A34A",
  collective: "#7C3AED",
};

const getDateLocale = (language: string) => {
  if (language.startsWith("kk")) {
    return "kk-KZ";
  }

  if (language.startsWith("en")) {
    return "en-GB";
  }

  return "ru-RU";
};

export const ResolvedRequestCard = ({
  item,
  requestType,
  isFavorite = false,
}: Props) => {
  const { t, i18n } = useTranslation();

  const language = i18n.resolvedLanguage ?? i18n.language ?? "ru";

  const [expandedQ, setExpandedQ] = useState(false);
  const [expandedA, setExpandedA] = useState(false);

  const [isStarred, setIsStarred] = useState(isFavorite);
  const [isStarring, setIsStarring] = useState(false);

  const [qLikes, setQLikes] = useState(Number(item.solution_likes) || 0);
  const [qDislikes, setQDislikes] = useState(
    Number(item.solution_dislikes) || 0,
  );
  const [userVoteQ, setUserVoteQ] = useState<VoteType | null>(null);
  const [isVotingQ, setIsVotingQ] = useState(false);

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

        setIsStarred(favorites.includes(item.id.toString()));

        const stored = await AsyncStorage.getItem(VOTES_STORAGE_KEY);

        if (!stored) {
          return;
        }

        const votesObj = JSON.parse(stored);
        const savedVoteQ = votesObj[`${item.id}_Q`];
        const savedVoteA = votesObj[`${item.id}_A`];

        if (savedVoteQ === "like" || savedVoteQ === "dislike") {
          setUserVoteQ(savedVoteQ);
        }

        if (savedVoteA === "like" || savedVoteA === "dislike") {
          setUserVoteA(savedVoteA);
        }
      } catch (error) {
        console.error("Error loading votes:", error);
      }
    };

    loadPersistedData();
  }, [item.id]);

  useEffect(() => {
    setQLikes(Number(item.solution_likes) || 0);
    setQDislikes(Number(item.solution_dislikes) || 0);
    setALikes(Number(item.comment_likes) || 0);
    setADislikes(Number(item.comment_dislikes) || 0);
  }, [
    item.id,
    item.solution_likes,
    item.solution_dislikes,
    item.comment_likes,
    item.comment_dislikes,
  ]);

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return "";
    }

    const normalizedDate = dateString.includes(" ")
      ? dateString.replace(" ", "T")
      : dateString;

    const date = new Date(normalizedDate);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString(getDateLocale(language), {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const handleStarPress = async () => {
     if (isStarring) {
       return;
     }
 
     setIsStarring(true);
 
     const previousStarred = isStarred;
     const nextStarred = !previousStarred;
 
     setIsStarred(nextStarred);
 
     try {
       const uuid = await getOrCreateUUID();
 
       await toggleFavoriteApi(uuid, item.id);
 
       await toggleFavorite(item.id.toString());
     } catch (error) {
       console.error("Favorite error:", error);
 
       setIsStarred(previousStarred);
     } finally {
       setIsStarring(false);
     }
   };

  const saveVoteToStorage = async (suffix: VoteSuffix, type: VoteType) => {
    const stored = await AsyncStorage.getItem(VOTES_STORAGE_KEY);
    const votesObj = stored ? JSON.parse(stored) : {};

    votesObj[`${item.id}${suffix}`] = type;

    await AsyncStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votesObj));
  };

  const handleVoteQ = async (type: VoteType) => {
    if (isVotingQ || userVoteQ) {
      return;
    }

    const previousLikes = qLikes;
    const previousDislikes = qDislikes;

    setIsVotingQ(true);
    setUserVoteQ(type);

    if (type === "like") {
      setQLikes((prev) => prev + 1);
    } else {
      setQDislikes((prev) => prev + 1);
    }

    try {
      const uuid = await getOrCreateUUID();

      await sendLikeDislike(requestType, "solution", uuid, item.id, type);
      await saveVoteToStorage("_Q", type);
    } catch (error) {
      console.error("Vote question error:", error);

      setUserVoteQ(null);
      setQLikes(previousLikes);
      setQDislikes(previousDislikes);
    } finally {
      setIsVotingQ(false);
    }
  };

  const handleVoteA = async (type: VoteType) => {
    if (isVotingA || userVoteA) {
      return;
    }

    const previousLikes = aLikes;
    const previousDislikes = aDislikes;

    setIsVotingA(true);
    setUserVoteA(type);

    if (type === "like") {
      setALikes((prev) => prev + 1);
    } else {
      setADislikes((prev) => prev + 1);
    }

    try {
      const uuid = await getOrCreateUUID();

      await sendLikeDislike(requestType, "comment", uuid, item.id, type);
      await saveVoteToStorage("_A", type);
    } catch (error) {
      console.error("Vote answer error:", error);

      setUserVoteA(null);
      setALikes(previousLikes);
      setADislikes(previousDislikes);
    } finally {
      setIsVotingA(false);
    }
  };

  const isQDisabled = isVotingQ || userVoteQ !== null;
  const isADisabled = isVotingA || userVoteA !== null;

  const softColor = TYPE_COLOR[requestType] ?? "#EAF3FF";
  const accentColor = TYPE_ACCENT[requestType] ?? "#2563EB";

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[softColor, "#FFFFFF"]}
        locations={[0, 0.75]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.authorBlock}>
            <View style={[styles.avatarBox, { backgroundColor: softColor }]}>
              <AnonIcon width={28} height={28} />
            </View>

            <View style={styles.authorInfo}>
              <Text style={styles.anon}>
                {t("resolvedRequestCard.anonymous", {
                  defaultValue: "Аноним",
                })}
              </Text>

              {!!formatDate(item.created_at) && (
                <Text style={styles.date}>{formatDate(item.created_at)}</Text>
              )}
            </View>
          </View>

          <Pressable
            onPress={handleStarPress}
            hitSlop={10}
            disabled={isStarring}
            style={styles.starButton}
            accessibilityLabel={
              isStarred
                ? t("resolvedRequestCard.removeFavorite")
                : t("resolvedRequestCard.addFavorite")
            }
          >
            {isStarring ? (
              <ActivityIndicator size="small" color={accentColor} />
            ) : isStarred ? (
              <StarFilledIcon width={22} height={22} />
            ) : (
              <StarIcon width={22} height={22} />
            )}
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.requestTitle}>{item.problem}</Text>

          {!!item.solution?.trim() && (
            <>
              <View style={styles.solutionBadge}>
                <Text
                  style={[styles.solutionBadgeText, { color: accentColor }]}
                >
                  {t("resolvedRequestCard.solutionOption", {
                    defaultValue: "Предложенное решение",
                  })}
                </Text>
              </View>

              <Pressable onPress={() => setExpandedQ((prev) => !prev)}>
                <Text
                  style={styles.requestText}
                  numberOfLines={expandedQ ? undefined : 3}
                  ellipsizeMode="tail"
                >
                  {item.solution}
                </Text>

                {!expandedQ && item.solution.length > 120 && (
                  <Text style={styles.moreTextInline}>
                    {t("resolvedRequestCard.more", {
                      defaultValue: "Подробнее",
                    })}
                  </Text>
                )}
              </Pressable>

              <View style={styles.footer}>
                <VoteButton
                  type="like"
                  count={qLikes}
                  selectedVote={userVoteQ}
                  loading={isVotingQ}
                  disabled={isQDisabled}
                  onPress={() => handleVoteQ("like")}
                  accessibilityLabel={t(
                    "resolvedRequestCard.likeQuestion",
                  )}
                />

                <VoteButton
                  type="dislike"
                  count={qDislikes}
                  selectedVote={userVoteQ}
                  loading={isVotingQ}
                  disabled={isQDisabled}
                  onPress={() => handleVoteQ("dislike")}
                  accessibilityLabel={t(
                    "resolvedRequestCard.dislikeQuestion",
                  )}
                />
              </View>
            </>
          )}
        </View>

        {!!item.comment?.trim() && (
          <View style={styles.answerSection}>
            <View style={styles.answerHeader}>
              <View style={styles.answerAuthorBlock}>
                <View style={[styles.avatarBox, { backgroundColor: softColor }]}>
                  <SolutionIcon width={28} height={28} />
                </View>

                <View style={styles.authorInfo}>
                  <Text style={[styles.anon, { color: accentColor }]}>
                    {t("resolvedRequestCard.solutionAuthor", {
                      defaultValue: "Ответ администрации",
                    })}
                  </Text>

                  {!!formatDate(item.updated_at) && (
                    <Text style={styles.date}>{formatDate(item.updated_at)}</Text>
                  )}
                </View>
              </View>
            </View>

            <Pressable onPress={() => setExpandedA((prev) => !prev)}>
              <Text
                style={styles.requestText}
                numberOfLines={expandedA ? undefined : 3}
                ellipsizeMode="tail"
              >
                {item.comment}
              </Text>

              {!expandedA && item.comment.length > 120 && (
                <Text style={styles.moreTextInline}>
                  {t("resolvedRequestCard.more", {
                    defaultValue: "Подробнее",
                  })}
                </Text>
              )}
            </Pressable>

            <View style={styles.footer}>
              <VoteButton
                type="like"
                count={aLikes}
                selectedVote={userVoteA}
                loading={isVotingA}
                disabled={isADisabled}
                onPress={() => handleVoteA("like")}
                accessibilityLabel={t("resolvedRequestCard.likeAnswer")}
              />

              <VoteButton
                type="dislike"
                count={aDislikes}
                selectedVote={userVoteA}
                loading={isVotingA}
                disabled={isADisabled}
                onPress={() => handleVoteA("dislike")}
                accessibilityLabel={t("resolvedRequestCard.dislikeAnswer")}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

type VoteButtonProps = {
  type: VoteType;
  count: number;
  selectedVote: VoteType | null;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
  accessibilityLabel: string;
};

const VoteButton = ({
  type,
  count,
  selectedVote,
  loading,
  disabled,
  onPress,
  accessibilityLabel,
}: VoteButtonProps) => {
  const isLike = type === "like";
  const isActive = selectedVote === type;

  const activeColor = isLike ? "#16A34A" : "#DC2626";

  return (
    <Pressable
      style={[
        styles.voteButton,
        isActive &&
          (isLike
            ? styles.voteButtonLikeActive
            : styles.voteButtonDislikeActive),
        disabled && styles.btnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
    >
      {loading && isActive ? (
        <ActivityIndicator size="small" color={activeColor} />
      ) : (
        <>
          {isLike ? (
            <LikeIcon
              width={18}
              height={16}
              fill={isActive ? activeColor : "#64748B"}
            />
          ) : (
            <DislikeIcon
              width={18}
              height={16}
              fill={isActive ? activeColor : "#64748B"}
            />
          )}

          <Text
            style={[
              styles.voteText,
              isActive &&
                (isLike
                  ? styles.voteTextLikeActive
                  : styles.voteTextDislikeActive),
            ]}
          >
            {count}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  content: {
    padding: 16,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  authorBlock: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  answerAuthorBlock: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  authorInfo: {
    flex: 1,
  },

  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  anon: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },

  date: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },

  starButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  body: {
    marginTop: 16,
  },

  requestTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    color: "#0F172A",
  },

  solutionBadge: {
    alignSelf: "flex-start",
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  solutionBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },

  requestText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
    color: "#475569",
  },

  moreTextInline: {
    color: "#64748B",
    fontWeight: "800",
    fontSize: 12,
    marginTop: 4,
  },

  answerSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EAF0F6",
  },

  answerHeader: {
    marginBottom: 12,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#EAF0F6",
  },

  voteButton: {
    minWidth: 62,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  voteButtonLikeActive: {
    backgroundColor: "#ECFDF3",
    borderColor: "#BBF7D0",
  },

  voteButtonDislikeActive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },

  btnDisabled: {
    opacity: 0.65,
  },

  voteText: {
    fontWeight: "800",
    color: "#64748B",
    fontSize: 13,
  },

  voteTextLikeActive: {
    color: "#16A34A",
  },

  voteTextDislikeActive: {
    color: "#DC2626",
  },
});