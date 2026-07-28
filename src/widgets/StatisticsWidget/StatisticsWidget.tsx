import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { colors } from "@shared/theme/colors";

import ViolationIcon from "../../../assets/stat-icons/violation.svg";
import WorkIcon from "../../../assets/stat-icons/work.svg";
import SalaryIcon from "../../../assets/stat-icons/salary.svg";
import SocialIcon from "../../../assets/stat-icons/social.svg";
import CollectiveIcon from "../../../assets/stat-icons/collective.svg";

type RequestType = "violation" | "work" | "salary" | "social" | "collective";
type NavigationProp = NativeStackNavigationProp<any>;

type Props = {
  violation: number | string;
  work: number | string;
  salary: number | string;
  social: number | string;
  collective: number | string;
};

type StatCardProps = {
  value: string | number;
  label: string;
  Icon: React.FC<any>;
  type: RequestType;
};

const CARD_STYLES: Record<
  RequestType,
  { backgroundColor: string; borderColor: string }
> = {
  violation: {
    backgroundColor: colors.violationLight,
    borderColor: colors.violationBorder,
  },
  work: {
    backgroundColor: colors.workLight,
    borderColor: colors.workBorder,
  },
  salary: {
    backgroundColor: colors.salaryLight,
    borderColor: colors.salaryBorder,
  },
  social: {
    backgroundColor: colors.socialLight,
    borderColor: colors.socialBorder,
  },
  collective: {
    backgroundColor: colors.collectiveLight,
    borderColor: colors.collectiveBorder,
  },
};

export const StatisticsWidget = ({
  violation,
  work,
  salary,
  social,
  collective,
}: Props) => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();

  const total =
    Number(violation) +
    Number(work) +
    Number(salary) +
    Number(social) +
    Number(collective);

  const cards: StatCardProps[] = [
    {
      value: violation,
      label: t("statistics.violation"),
      Icon: ViolationIcon,
      type: "violation",
    },
    {
      value: work,
      label: t("statistics.work"),
      Icon: WorkIcon,
      type: "work",
    },
    {
      value: salary,
      label: t("statistics.salary"),
      Icon: SalaryIcon,
      type: "salary",
    },
    {
      value: social,
      label: t("statistics.social"),
      Icon: SocialIcon,
      type: "social",
    },
    {
      value: collective,
      label: t("statistics.collective"),
      Icon: CollectiveIcon,
      type: "collective",
    },
  ];

  const handleSubmitPress = () => {
    navigation.navigate("RequestsTab", {
      screen: "RequestsPage",
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>{t("statistics.title")}</Text>

          <View style={styles.totalRow}>
            <Text style={styles.headerSubtitle}>
              {t("statistics.totalRequests", { count: total })}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleSubmitPress}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.headerButtonPressed,
          ]}
        >
          <Text style={styles.headerButtonText}>{t("statistics.submit")}</Text>
          <Text style={styles.headerButtonArrow}>›</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {cards.map((item) => (
          <StatCard
            key={item.type}
            value={item.value}
            label={item.label}
            Icon={item.Icon}
            type={item.type}
          />
        ))}
      </View>
    </View>
  );
};

const StatCard = ({ value, label, Icon, type }: StatCardProps) => {
  const navigation = useNavigation<NavigationProp>();
  const cardStyle = CARD_STYLES[type];

  return (
    <Pressable
      onPress={() =>
        navigation.navigate("RequestsList", {
          requestType: type,
        })
      }
      style={({ pressed }) => [
        styles.card,
        cardStyle,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.iconWrapper}>
        <Icon width={20} height={20} />
      </View>

      <Text style={styles.cardValue}>{value}</Text>

      <Text style={styles.cardLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  headerTextBlock: {
    flex: 1,
  },

  headerTitle: {
    color: colors.primary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
  },

  totalRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },

  headerSubtitle: {
    color: colors.textLight,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },

  totalBadge: {
    minWidth: 24,
    height: 20,
    marginLeft: 6,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
  },

  totalBadgeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "900",
  },

  headerButton: {
    minHeight: 36,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 3,
  },

  headerButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },

  headerButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },

  headerButtonArrow: {
    marginTop: -1,
    marginLeft: 5,
    color: colors.white,
    fontSize: 20,
    lineHeight: 20,
    fontWeight: "400",
  },

  content: {
    flexDirection: "row",
    gap: 7,
  },

  card: {
    flex: 1,
    minWidth: 0,
    height: 96,
    paddingHorizontal: 3,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 18,
  },

  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.95 }],
  },

  iconWrapper: {
    width: 34,
    height: 34,
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.iconBackground,
  },

  cardValue: {
    color: colors.primary,
    fontSize: 19,
    lineHeight: 21,
    fontWeight: "900",
  },

  cardLabel: {
    minHeight: 22,
    marginTop: 2,
    color: colors.textLight,
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: "800",
    textAlign: "center",
  },
});