import React, { useEffect } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface CardProgressIndicatorProps {
  cards: Array<{
    id: number | string;
    status: "pending" | "correct" | "incorrect" | "current";
  }>;
  currentIndex: number;
  maxVisible?: number;
}

interface VisibleCard {
  id: number | string;
  status: "pending" | "correct" | "incorrect" | "current" | "placeholder";
  displayIndex: number;
  isVisible: boolean;
}

export const CardProgressIndicator: React.FC<CardProgressIndicatorProps> = ({
  cards,
  currentIndex,
  maxVisible = 6,
}) => {
  const slideOffset = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);

  // Trigger pulse animation when status changes
  useEffect(() => {
    pulseAnimation.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  }, [cards]);

  // Calculate which cards to show based on current index
  const getVisibleCards = (): VisibleCard[] => {
    const totalCards = cards.length;
    let startIndex = Math.max(0, currentIndex - Math.floor(maxVisible / 2));
    
    // Adjust startIndex to ensure we always show maxVisible cards when possible
    if (startIndex + maxVisible > totalCards) {
      startIndex = Math.max(0, totalCards - maxVisible);
    }
    
    const endIndex = Math.min(totalCards, startIndex + maxVisible);
    const actualCards = cards.slice(startIndex, endIndex);
    
    // If we have fewer cards than maxVisible, pad with empty slots to maintain width
    const paddedCards: VisibleCard[] = actualCards.map((card, index) => ({
      ...card,
      displayIndex: startIndex + index + 1,
      isVisible: true,
    }));
    
    while (paddedCards.length < maxVisible && totalCards >= maxVisible) {
      // Add empty placeholder at the end
      paddedCards.push({
        id: `placeholder-${paddedCards.length}`,
        status: 'placeholder',
        displayIndex: -1,
        isVisible: false,
      });
    }
    
    return paddedCards;
  };

  const visibleCards = getVisibleCards();

  const getCardStyle = (status: string, index: number) => {
    const baseStyle = [styles.cardIndicator];

    switch (status) {
      case "current":
        return [...baseStyle, styles.currentCard];
      case "correct":
        return [...baseStyle, styles.correctCard];
      case "incorrect":
        return [...baseStyle, styles.incorrectCard];
      case "placeholder":
        return [...baseStyle, styles.placeholderCard];
      default:
        return [...baseStyle, styles.pendingCard];
    }
  };

  const pulseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseAnimation.value }],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.indicatorContainer}>
        <View style={styles.cardRow}>
          {visibleCards.map((card, index) => (
            <Animated.View
              key={card.id}
              style={[
                getCardStyle(card.status, index),
                card.status === "current" && pulseAnimatedStyle,
                { 
                  opacity: card.status === "pending" ? 0.6 : card.isVisible ? 1 : 0,
                },
              ]}
            >
              {card.isVisible && (
                <Text
                  style={[
                    styles.cardNumber,
                    card.status === "current" && styles.currentCardText,
                    card.status === "correct" && styles.correctCardText,
                    card.status === "incorrect" && styles.incorrectCardText,
                  ]}
                >
                  {card.displayIndex}
                </Text>
              )}
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: "center",
  },
  indicatorContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "rgba(0, 255, 255, 0.3)",
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  pendingCard: {
    backgroundColor: "transparent",
    borderColor: "rgba(0, 255, 255, 0.6)",
  },
  placeholderCard: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  currentCard: {
    backgroundColor: "rgba(0, 255, 255, 0.2)",
    borderColor: "#00FFFF",
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  correctCard: {
    backgroundColor: "rgba(0, 255, 0, 0.2)",
    borderColor: "#00FF00",
    shadowColor: "#00FF00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
  incorrectCard: {
    backgroundColor: "rgba(255, 0, 0, 0.2)",
    borderColor: "#FF0000",
    shadowColor: "#FF0000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
  cardNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  currentCardText: {
    color: "#00FFFF",
    fontSize: 16,
  },
  correctCardText: {
    color: "#00FF00",
  },
  incorrectCardText: {
    color: "#FF0000",
  },
});
