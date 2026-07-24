import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

interface WelcomeCardProps {
  firstName?: string | null;
  middleName?: string | null;
  profsoyuzName?: string | null;
  status?: number | null;
  loading?: boolean;
}

export const WelcomeCard = ({
  firstName,
  middleName,
  profsoyuzName,
  status,
  loading = false,
}: WelcomeCardProps) => {
  const { t } = useTranslation();

  const userName = [firstName, middleName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const getStatusText = () => {
    if (status === 1) {
      return t("welcomeCard.statusActive");
    }

    if (status === 0) {
      return t("welcomeCard.statusInactive");
    }

    return t("welcomeCard.statusUnauthorized");
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#0054A6", "#003d7a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.loadingCard]}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />

        <Text style={styles.loadingText}>
          {t("welcomeCard.loadingProfile")}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#0054A6", "#003d7a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.content}>
        <View style={styles.infoBlock}>
          <Text style={styles.littleTitle}>
            {t("welcomeCard.welcome")}
          </Text>

          <Text
            style={styles.nameValue}
            numberOfLines={2}
          >
            {userName || t("welcomeCard.user")}
          </Text>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.littleTitle}>
            {t("welcomeCard.organization")}
          </Text>

          <Text
            style={styles.organizationTitle}
            numberOfLines={2}
          >
            {profsoyuzName || t("welcomeCard.organizationNotSpecified")}
          </Text>
        </View>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>
          {t("welcomeCard.status")}
        </Text>

        <Text
          style={[
            styles.statusValue,
            status === 0 && styles.inactiveStatus,
          ]}
        >
          {getStatusText()}
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    position: "relative",
    width: "100%",
    minHeight: 180,
    borderRadius: 24,
    padding: 18,
    overflow: "hidden",

    shadowColor: "#0054A6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },

  loadingCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loadingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingRight: 115,
  },

  infoBlock: {
    maxWidth: "100%",
  },

  littleTitle: {
    marginBottom: 3,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.9,
  },

  nameValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 27,
  },

  organizationTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
  },

  statusCard: {
    position: "absolute",
    top: 60,
    right: 18,

    width: 105,
    minHeight: 60,
    paddingHorizontal: 8,
    paddingVertical: 8,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 16,
  },

  statusTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  statusValue: {
    marginTop: 3,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },

  inactiveStatus: {
    opacity: 0.75,
  },
});