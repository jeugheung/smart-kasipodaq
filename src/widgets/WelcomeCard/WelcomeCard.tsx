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
    .filter(
      (value): value is string =>
        typeof value === "string" &&
        value.trim().length > 0,
    )
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

  const getStatusStyle = () => {
    if (status === 1) {
      return styles.statusActive;
    }

    if (status === 0) {
      return styles.statusInactive;
    }

    return styles.statusUnauthorized;
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#0A65B7", "#004B87"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.loadingCard]}
      >
        <ActivityIndicator
          size="large"
          color="#FFFFFF"
        />

        <Text style={styles.loadingText}>
          {t("welcomeCard.loadingProfile")}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#0B66B8", "#00447F"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.decorCircleLarge} />
      <View style={styles.decorCircleSmall} />

      <View style={styles.topRow}>
        <View style={styles.welcomeBlock}>
          <Text style={styles.welcomeText}>
            {t("welcomeCard.welcome")}
          </Text>

          <Text
            style={styles.nameValue}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.78}
          >
            {userName || t("welcomeCard.user")}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            getStatusStyle(),
          ]}
        >
          <View style={styles.statusDot} />

          <Text
            style={styles.statusValue}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {getStatusText()}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.organizationRow}>
        <View style={styles.organizationIcon}>
          <Text style={styles.organizationIconText}>
            🏢
          </Text>
        </View>

        <View style={styles.organizationContent}>
          <Text style={styles.organizationLabel}>
            {t("welcomeCard.organization")}
          </Text>

          <Text
            style={styles.organizationTitle}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {profsoyuzName ||
              t(
                "welcomeCard.organizationNotSpecified",
              )}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    position: "relative",
    width: "100%",
    minHeight: 205,
    paddingHorizontal: 20,
    paddingVertical: 20,
    overflow: "hidden",
    borderRadius: 26,

    shadowColor: "#004B87",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 9,
  },

  loadingCard: {
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 11,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  decorCircleLarge: {
    position: "absolute",
    top: -85,
    right: -65,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor:
      "rgba(255,255,255,0.07)",
  },

  decorCircleSmall: {
    position: "absolute",
    right: 35,
    bottom: -55,
    width: 115,
    height: 115,
    borderRadius: 58,
    backgroundColor:
      "rgba(255,255,255,0.05)",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  welcomeBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },

  welcomeText: {
    marginBottom: 6,
    color: "rgba(255,255,255,0.86)",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
  },

  nameValue: {
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  statusBadge: {
    maxWidth: 126,
    minHeight: 40,
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 14,
  },

  statusActive: {
    backgroundColor:
      "rgba(46, 204, 113, 0.18)",
    borderColor:
      "rgba(188, 255, 216, 0.55)",
  },

  statusInactive: {
    backgroundColor:
      "rgba(255, 184, 77, 0.18)",
    borderColor:
      "rgba(255, 220, 165, 0.55)",
  },

  statusUnauthorized: {
    backgroundColor:
      "rgba(255,255,255,0.12)",
    borderColor:
      "rgba(255,255,255,0.32)",
  },

  statusDot: {
    width: 7,
    height: 7,
    marginRight: 7,
    flexShrink: 0,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },

  statusValue: {
    flexShrink: 1,
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  divider: {
    height: 1,
    marginTop: 22,
    marginBottom: 17,
    backgroundColor:
      "rgba(255,255,255,0.16)",
  },

  organizationRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  organizationIcon: {
    width: 44,
    height: 44,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderRadius: 14,
    backgroundColor:
      "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.18)",
  },

  organizationIconText: {
    fontSize: 20,
  },

  organizationContent: {
    flex: 1,
    minWidth: 0,
  },

  organizationLabel: {
    marginBottom: 3,
    color: "rgba(255,255,255,0.74)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },

  organizationTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
  },
});