import { colors } from "@shared/theme/colors";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
        typeof value === "string" && value.trim().length > 0,
    )
    .join(" ")
    .trim();

  const getStatusText = () => {
    if (status === 1) return t("welcomeCard.statusActive");
    if (status === 0) return t("welcomeCard.statusInactive");
    return t("welcomeCard.statusUnauthorized");
  };

  const getStatusStyle = () => {
    if (status === 1) return styles.statusActive;
    if (status === 0) return styles.statusInactive;
    return styles.statusUnauthorized;
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[
          colors.welcomeGradientStart,
          colors.welcomeGradientEnd,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.loadingCard]}
      >
        <ActivityIndicator size="large" color={colors.white} />

        <Text style={styles.loadingText}>
          {t("welcomeCard.loadingProfile")}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[
        colors.welcomeGradientStart,
        colors.welcomeGradientMiddle,
        colors.welcomeGradientEnd,
      ]}
      locations={[0, 0.55, 1]}
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
            minimumFontScale={0.76}
          >
            {userName || t("welcomeCard.user")}
          </Text>
        </View>

        <View style={[styles.statusBadge, getStatusStyle()]}>
          <View style={styles.statusDot} />

          <Text
            style={styles.statusValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {getStatusText()}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.organizationRow}>
        <View style={styles.organizationIcon}>
          <Text style={styles.organizationIconText}>🏢</Text>
        </View>

        <View style={styles.organizationContent}>
          <Text style={styles.organizationLabel}>
            {t("welcomeCard.organization")}
          </Text>

          <Text
            style={styles.organizationTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {profsoyuzName ||
              t("welcomeCard.organizationNotSpecified")}
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
    minHeight: 168,
    paddingHorizontal: 18,
    paddingVertical: 17,
    overflow: "hidden",
    borderRadius: 22,
    shadowColor: colors.welcomeShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },

  loadingCard: {
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 8,
    color: colors.white,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },

  decorCircleLarge: {
    position: "absolute",
    top: -74,
    right: -54,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.welcomeDecoration,
  },

  decorCircleSmall: {
    position: "absolute",
    right: 24,
    bottom: -56,
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.welcomeDecorationLight,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  welcomeBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },

  welcomeText: {
    marginBottom: 4,
    color: colors.welcomeTextMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },

  nameValue: {
    color: colors.white,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  statusBadge: {
    maxWidth: 116,
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 13,
  },

  statusActive: {
    backgroundColor: colors.welcomeBadge,
    borderColor: colors.welcomeBadgeBorder,
  },

  statusInactive: {
    backgroundColor: colors.welcomeInactiveBadge,
    borderColor: colors.welcomeInactiveBorder,
  },

  statusUnauthorized: {
    backgroundColor: colors.welcomeNeutralBadge,
    borderColor: colors.welcomeNeutralBorder,
  },

  statusDot: {
    width: 6,
    height: 6,
    marginRight: 6,
    flexShrink: 0,
    borderRadius: 3,
    backgroundColor: colors.white,
  },

  statusValue: {
    flexShrink: 1,
    color: colors.white,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  divider: {
    height: 1,
    marginTop: 15,
    marginBottom: 13,
    backgroundColor: colors.welcomeDivider,
  },

  organizationRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  organizationIcon: {
    width: 38,
    height: 38,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 1,
    borderColor: colors.welcomeIconBorder,
    borderRadius: 12,
    backgroundColor: colors.welcomeIconBackground,
  },

  organizationIconText: {
    fontSize: 17,
  },

  organizationContent: {
    flex: 1,
    minWidth: 0,
  },

  organizationLabel: {
    marginBottom: 2,
    color: colors.welcomeTextSecondary,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
  },

  organizationTitle: {
    color: colors.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },
});