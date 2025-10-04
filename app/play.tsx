import { CardProgressIndicator } from "../components/CardProgressIndicator";
import { SwipeableCard } from "../components/SwipeableCard";
import React, { useCallback, useState, useEffect } from "react";
import {
  Dimensions,
  StyleSheet,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { router } from "expo-router";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Generate random colors
const generateRandomColor = (): string => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
    "#F1948A",
    "#85C1E9",
    "#D7BDE2",
    "#A3E4D7",
    "#F9E79F",
    "#FADBD8",
    "#D5DBDB",
    "#AED6F1",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Generate random direction
const generateRandomDirection = (): "left" | "right" | "up" | "down" => {
  const directions: ("left" | "right" | "up" | "down")[] = [
    "left",
    "right",
    "up",
    "down",
  ];
  return directions[Math.floor(Math.random() * directions.length)];
};

const generateCards = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    color: generateRandomColor(),
    targetDirection: generateRandomDirection(),
    status: "pending" as "pending" | "correct" | "incorrect",
  }));
};

const MAX_CARDS = 20;

export default function PlayScreen() {
  const [cards, setCards] = useState(() => generateCards(10));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  // Initialize audio player with the background music
  const player = useAudioPlayer(require("../assets/song/bep-where-is-the-love.mp3"));

  // Configure audio mode for iOS and start game
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
        });
        
        // Play audio when game starts
        player.seekTo(0); // Reset to beginning
        player.play();
      } catch (error) {
        console.error("Failed to configure audio mode or play audio:", error);
      }
    };
    
    configureAudio();
  }, [player]);

  const handleSwipe = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      console.log(`Card swiped ${direction}`);

      setCards((prevCards) => {
        const updatedCards = [...prevCards];
        const currentCard = updatedCards[currentIndex];

        if (currentCard) {
          // Check if swipe direction matches target direction
          const isCorrect = currentCard.targetDirection === direction;
          updatedCards[currentIndex] = {
            ...currentCard,
            status: isCorrect ? "correct" : "incorrect",
          };

          // Update success/failed counts
          if (isCorrect) {
            setSuccessCount((prev) => prev + 1);
          } else {
            setFailedCount((prev) => prev + 1);
          }
        }

        return updatedCards;
      });

      // Move to next card after a short delay
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);

        // Check if game is completed (reached max cards)
        if (nextIndex >= MAX_CARDS) {
          const endTime = Date.now();
          const duration = (endTime - startTime) / 1000; // Convert to seconds
          
          // Stop audio
          try {
            player.pause();
          } catch (error) {
            console.error("Failed to pause audio:", error);
          }
          
          // Navigate to result screen with game data
          router.push({
            pathname: "/result",
            params: {
              duration: duration.toFixed(1),
              successCount: successCount.toString(),
              failedCount: failedCount.toString(),
              totalCards: MAX_CARDS.toString(),
            },
          });
          return;
        }

        // Add new cards if running low and haven't reached max
        setCards((prevCards) => {
          if (
            prevCards.length - nextIndex < 3 &&
            prevCards.length < MAX_CARDS
          ) {
            const newCard = {
              id: Date.now() + Math.random(),
              color: generateRandomColor(),
              targetDirection: generateRandomDirection(),
              status: "pending" as "pending" | "correct" | "incorrect",
            };
            return [...prevCards, newCard];
          }
          return prevCards;
        });
      }, 300);
    },
    [currentIndex, startTime, successCount, failedCount, player]
  );

  // Prepare progress indicator data
  const progressCards = cards.map((card, index) => ({
    id: card.id,
    status: (index === currentIndex ? "current" : card.status) as
      | "pending"
      | "correct"
      | "incorrect"
      | "current",
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <CardProgressIndicator
        cards={progressCards}
        currentIndex={currentIndex}
        maxVisible={6}
      />
      <View style={styles.cardContainer}>
        {cards
          .slice(currentIndex, currentIndex + 3)
          .map((card, index) => (
            <SwipeableCard
              key={card.id}
              color={card.color}
              onSwipe={handleSwipe}
              index={index}
              targetDirection={card.targetDirection}
            />
          ))}
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
});