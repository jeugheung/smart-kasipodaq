import { colors } from "@shared/theme/colors";
import { DefaultLayout } from "@widgets/Layout/DefaultLayout";
import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";


export const EventsPage = ({ navigation }: any) => {


  return (
    <DefaultLayout variant="default" onRightPress={() => alert("EN")}>
      <View style={styles.content}>
         <Text>Events Page</Text>
      
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

