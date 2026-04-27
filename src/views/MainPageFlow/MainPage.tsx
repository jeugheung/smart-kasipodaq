import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import { WelcomeCard } from "@widgets/WelcomeCard";
import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";


export const MainPage = ({ navigation }: any) => {


 

  return (
    <DefaultLayout variant="default" title="Smart Kasipodaq" onRightPress={() => alert("EN")}>
      <View style={styles.content}>
         <WelcomeCard />
      
      </View>
    </DefaultLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 20,
    paddingBottom: 100,
    backgroundColor: colors.background,
    gap: 20,
    minHeight: "100%",
  },
});

