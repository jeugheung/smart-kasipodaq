import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppButton } from "@shared/ui/AppButton";

import ViolationIcon from "../../../assets/stat-icons/violation.svg";
import WorkIcon from "../../../assets/stat-icons/work.svg";
import SalaryIcon from "../../../assets/stat-icons/salary.svg";
import SocialIcon from "../../../assets/stat-icons/social.svg";
import CollectiveIcon from "../../../assets/stat-icons/collective.svg";

type RequestType = "violation" | "work" | "salary" | "social" | "collective";

type Props = {
  violation: number | string;
  work: number | string;
  salary: number | string;
  social: number | string;
  collective: number | string;
};

type NavigationProp = NativeStackNavigationProp<any>;

const CARD_COLORS: Record<RequestType, string> = {
  violation: "#EAF3FF",
  work: "#FFF6D8",
  salary: "#FFF0DF",
  social: "#ECFDF3",
  collective: "#F2EAFE",
};

export const StatisticsWidget = ({
  violation,
  work,
  salary,
  social,
  collective,
}: Props) => {
  const navigation = useNavigation<NavigationProp>();

  const total =
    Number(violation) +
    Number(work) +
    Number(salary) +
    Number(social) +
    Number(collective);

  const cards = [
    { value: violation, label: "ТК", Icon: ViolationIcon, type: "violation" },
    { value: work, label: "Условия", Icon: WorkIcon, type: "work" },
    { value: salary, label: "Оплата", Icon: SalaryIcon, type: "salary" },
    { value: social, label: "Льготы", Icon: SocialIcon, type: "social" },
    { value: collective, label: "Договор", Icon: CollectiveIcon, type: "collective" },
  ] as const;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Статистика</Text>
          <Text style={styles.headerSubtitle}>Всего заявок: {total}</Text>
        </View>

        <Pressable
          style={styles.headerButton}
          onPress={() =>
            navigation.navigate("RequestsTab", {
              screen: "RequestsPage",
            })
          }
        >
          <Text style={styles.headerButtonText}>Подать</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {cards.map(item => (
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

type StatCardProps = {
  value: string | number;
  label: string;
  Icon: React.FC<any>;
  type: RequestType;
};

const StatCard = ({ value, label, Icon, type }: StatCardProps) => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: CARD_COLORS[type] },
        pressed && styles.cardPressed,
      ]}
      onPress={() =>
        navigation.navigate("RequestsList", {
          requestType: type,
        })
      }
    >
      <View style={styles.iconWrapper}>
        <Icon width={20} height={20} />
      </View>

      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#002F42",
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  headerButton: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: "#0057B8",
    alignItems: "center",
    justifyContent: "center",
  },

  headerButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  content: {
    flexDirection: "row",
    gap: 7,
  },

  card: {
    flex: 1,
    height: 84,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },

  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },

  cardValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#002F42",
    lineHeight: 20,
  },

  cardLabel: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "800",
    color: "#475569",
    textAlign: "center",
  },
});