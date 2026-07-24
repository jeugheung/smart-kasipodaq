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
import StarIcon from "../../../assets/request-card/start.svg";
import StarFilledIcon from "../../../assets/request-card/star-filled.svg";
import LikeIcon from "../../../assets/request-card/like.svg";
import DislikeIcon from "../../../assets/request-card/dislike.svg";

import { getOrCreateUUID } from "../../shared/lib/uuid";
import { getFavorites, toggleFavorite } from "@shared/lib/favourites";

import { sendLikeDislike, toggleFavoriteApi } from "../../shared/api/endpoints";

type Props = {
  item: RequestItem;
  requestType: RequestType;
  isFavorite?: boolean;
};

const VOTES_STORAGE_KEY = "@user_votes";

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

export const PendingRequestCard = ({
  item,
  requestType,
  isFavorite = false,
}: Props) => {
  const { t, i18n } = useTranslation();

  const language = i18n.resolvedLanguage ?? i18n.language ?? "ru";

  const [expanded, setExpanded] = useState(false);

  const [isStarred, setIsStarred] = useState(isFavorite);

  const [isStarring, setIsStarring] = useState(false);

  const [likesCount, setLikesCount] = useState(
    Number(item.solution_likes) || 0,
  );

  const [dislikesCount, setDislikesCount] = useState(
    Number(item.solution_dislikes) || 0,
  );

  const [userVote, setUserVote] = useState<"like" | "dislike" | null>(null);

  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const favorites = await getFavorites();

        setIsStarred(favorites.includes(item.id.toString()));

        const storedVotes = await AsyncStorage.getItem(VOTES_STORAGE_KEY);

        if (storedVotes) {
          const votesObj = JSON.parse(storedVotes);

          const myVote = votesObj[item.id.toString()];

          if (myVote === "like" || myVote === "dislike") {
            setUserVote(myVote);
          }
        }
      } catch (error) {
        console.error("Error loading persisted data", error);
      }
    };

    loadPersistedData();
  }, [item.id]);

  useEffect(() => {
    setLikesCount(Number(item.solution_likes) || 0);

    setDislikesCount(Number(item.solution_dislikes) || 0);
  }, [item.id, item.solution_likes, item.solution_dislikes]);

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);

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

  const handleVote = async (type: "like" | "dislike") => {
    if (isVoting || userVote) {
      return;
    }

    setIsVoting(true);

    const previousLikes = likesCount;
    const previousDislikes = dislikesCount;

    setUserVote(type);

    if (type === "like") {
      setLikesCount((prev) => prev + 1);
    } else {
      setDislikesCount((prev) => prev + 1);
    }

    try {
      const uuid = await getOrCreateUUID();

      await sendLikeDislike(requestType, "solution", uuid, item.id, type);

      const storedVotes = await AsyncStorage.getItem(VOTES_STORAGE_KEY);

      const votesObj = storedVotes ? JSON.parse(storedVotes) : {};

      votesObj[item.id.toString()] = type;

      await AsyncStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votesObj));
    } catch (error) {
      console.error("Vote error:", error);

      setUserVote(null);
      setLikesCount(previousLikes);
      setDislikesCount(previousDislikes);
    } finally {
      setIsVoting(false);
    }
  };

  const isInteractionDisabled =
    item.status === "new" || isVoting || userVote !== null;

  const accentColor = TYPE_ACCENT[requestType] ?? "#2563EB";

  const softColor = TYPE_COLOR[requestType] ?? "#EAF3FF";

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
            <View
              style={[
                styles.avatarBox,
                {
                  backgroundColor: softColor,
                },
              ]}
            >
              <AnonIcon width={28} height={28} />
            </View>

            <View>
              <Text style={styles.anon}>
                {t("pendingRequestCard.anonymous")}
              </Text>

              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>
          </View>

          <Pressable
            onPress={handleStarPress}
            hitSlop={10}
            disabled={isStarring}
            style={styles.starButton}
            accessibilityLabel={
              isStarred
                ? t("pendingRequestCard.removeFavorite")
                : t("pendingRequestCard.addFavorite")
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

          <View style={styles.solutionBadge}>
            <Text style={[styles.solutionBadgeText, { color: accentColor }]}>
              {t("pendingRequestCard.solutionOption")}
            </Text>
          </View>

          <Pressable onPress={() => setExpanded((prev) => !prev)}>
            <Text
              style={styles.requestText}
              numberOfLines={expanded ? undefined : 3}
              ellipsizeMode="tail"
            >
              {item.solution}
            </Text>

            {!expanded && item.solution && item.solution.length > 120 && (
              <Text style={styles.moreTextInline}>
                {t("pendingRequestCard.more")}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[
              styles.voteButton,
              userVote === "like" && styles.voteButtonLikeActive,
              isInteractionDisabled && styles.btnDisabled,
            ]}
            onPress={() => handleVote("like")}
            disabled={isInteractionDisabled}
            accessibilityLabel={t("pendingRequestCard.like")}
          >
            {isVoting && userVote === "like" ? (
              <ActivityIndicator size="small" color="#16A34A" />
            ) : (
              <>
                <LikeIcon
                  width={18}
                  height={16}
                  fill={userVote === "like" ? "#16A34A" : "#64748B"}
                />

                <Text
                  style={[
                    styles.voteText,
                    userVote === "like" && styles.voteTextLikeActive,
                  ]}
                >
                  {likesCount}
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={[
              styles.voteButton,
              userVote === "dislike" && styles.voteButtonDislikeActive,
              isInteractionDisabled && styles.btnDisabled,
            ]}
            onPress={() => handleVote("dislike")}
            disabled={isInteractionDisabled}
            accessibilityLabel={t("pendingRequestCard.dislike")}
          >
            {isVoting && userVote === "dislike" ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <DislikeIcon
                  width={18}
                  height={16}
                  fill={userVote === "dislike" ? "#DC2626" : "#64748B"}
                />

                <Text
                  style={[
                    styles.voteText,
                    userVote === "dislike" && styles.voteTextDislikeActive,
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
