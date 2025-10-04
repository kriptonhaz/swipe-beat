import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function HomeScreen() {
  const handleStartGame = () => {
    router.push("/play");
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.cardContainer}>
        <View style={styles.startContainer}>
          <Text style={styles.startTitle}>Swipe Beat</Text>
          <Text style={styles.startSubtitle}>
            Swipe cards in the direction of the arrow!
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartGame}
          >
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  startContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  startTitle: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#00FFFF",
    textAlign: "center",
    marginBottom: 16,
    textShadowColor: "#00FFFF",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  startSubtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: "#00FFFF",
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
  },
});
