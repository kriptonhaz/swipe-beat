import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ResultScreen() {
  const params = useLocalSearchParams();
  
  // Extract game results from navigation params
  const duration = params.duration as string;
  const successCount = parseInt(params.successCount as string) || 0;
  const failedCount = parseInt(params.failedCount as string) || 0;
  const totalCards = parseInt(params.totalCards as string) || 0;
  
  // Calculate accuracy percentage
  const accuracy = totalCards > 0 ? ((successCount / totalCards) * 100).toFixed(1) : "0.0";

  const handlePlayAgain = () => {
    router.push("/play");
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <View style={styles.container}>
      <View style={styles.resultContainer}>
        <Text style={styles.title}>Game Complete!</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{duration}s</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Correct Swipes:</Text>
            <Text style={[styles.detailValue, styles.successText]}>{successCount}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Incorrect Swipes:</Text>
            <Text style={[styles.detailValue, styles.failedText]}>{failedCount}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Cards:</Text>
            <Text style={styles.detailValue}>{totalCards}</Text>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.playAgainButton} onPress={handlePlayAgain}>
            <Text style={styles.playAgainButtonText}>Play Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  resultContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 30,
    width: SCREEN_WIDTH * 0.9,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#333",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 30,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 30,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#4ECDC4",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
  },
  detailsContainer: {
    width: "100%",
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  detailLabel: {
    fontSize: 16,
    color: "#ccc",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  successText: {
    color: "#4CAF50",
  },
  failedText: {
    color: "#F44336",
  },
  buttonContainer: {
    width: "100%",
    gap: 15,
  },
  playAgainButton: {
    backgroundColor: "#4ECDC4",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
  },
  playAgainButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
  homeButton: {
    backgroundColor: "transparent",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4ECDC4",
  },
  homeButtonText: {
    color: "#4ECDC4",
    fontSize: 18,
    fontWeight: "bold",
  },
});