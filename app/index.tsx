import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SwipeableCard } from '@/components/SwipeableCard';
import { CardProgressIndicator } from '@/components/CardProgressIndicator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Generate random colors
const generateRandomColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
    '#A3E4D7', '#F9E79F', '#FADBD8', '#D5DBDB', '#AED6F1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Generate random direction
const generateRandomDirection = (): 'left' | 'right' | 'up' | 'down' => {
  const directions: ('left' | 'right' | 'up' | 'down')[] = ['left', 'right', 'up', 'down'];
  return directions[Math.floor(Math.random() * directions.length)];
};

// Generate initial cards
const generateCards = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    color: generateRandomColor(),
    targetDirection: generateRandomDirection(),
    status: 'pending' as 'pending' | 'correct' | 'incorrect',
  }));
};

const MAX_CARDS = 20;

export default function HomeScreen() {
  const [cards, setCards] = useState(() => generateCards(10));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setStartTime(Date.now());
    setSuccessCount(0);
    setFailedCount(0);
    setEndTime(null);
  }, []);

  const restartGame = useCallback(() => {
    setCards(generateCards(10));
    setCurrentIndex(0);
    setGameCompleted(false);
    setGameStarted(false);
    setStartTime(null);
    setEndTime(null);
    setSuccessCount(0);
    setFailedCount(0);
  }, []);

  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    console.log(`Card swiped ${direction}`);
    
    setCards(prevCards => {
      const updatedCards = [...prevCards];
      const currentCard = updatedCards[currentIndex];
      
      if (currentCard) {
        // Check if swipe direction matches target direction
        const isCorrect = currentCard.targetDirection === direction;
        updatedCards[currentIndex] = {
          ...currentCard,
          status: isCorrect ? 'correct' : 'incorrect',
        };
        
        // Update success/failed counts
        if (isCorrect) {
          setSuccessCount(prev => prev + 1);
        } else {
          setFailedCount(prev => prev + 1);
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
        setGameCompleted(true);
        setEndTime(Date.now());
        return;
      }
      
      // Add new cards if running low and haven't reached max
      setCards(prevCards => {
        if (prevCards.length - nextIndex < 3 && prevCards.length < MAX_CARDS) {
          const newCard = {
             id: Date.now() + Math.random(),
             color: generateRandomColor(),
             targetDirection: generateRandomDirection(),
             status: 'pending' as 'pending' | 'correct' | 'incorrect',
           };
          return [...prevCards, newCard];
        }
        return prevCards;
      });
    }, 300);
  }, [currentIndex]);

  // Prepare progress indicator data
  const progressCards = cards.map((card, index) => ({
    id: card.id,
    status: (index === currentIndex ? 'current' : card.status) as 'pending' | 'correct' | 'incorrect' | 'current',
  }));

  // Calculate game duration
  const getGameDuration = () => {
    if (startTime && endTime) {
      const duration = (endTime - startTime) / 1000; // Convert to seconds
      return duration.toFixed(1);
    }
    return '0.0';
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {gameStarted && (
        <CardProgressIndicator 
          cards={progressCards}
          currentIndex={currentIndex}
          maxVisible={6}
        />
      )}
      <View style={styles.cardContainer}>
        {!gameStarted ? (
          <View style={styles.startContainer}>
            <Text style={styles.startTitle}>Swipe Beat</Text>
            <Text style={styles.startSubtitle}>Swipe cards in the direction of the arrow!</Text>
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
          </View>
        ) : gameCompleted ? (
          <View style={styles.completionContainer}>
            <Text style={styles.completionTitle}>Game Completed!</Text>
            <Text style={styles.completionSubtitle}>You've completed all {MAX_CARDS} cards</Text>
            <View style={styles.resultsContainer}>
              <Text style={styles.resultText}>Time: {getGameDuration()}s</Text>
              <Text style={styles.resultText}>Success: {successCount}</Text>
              <Text style={styles.resultText}>Failed: {failedCount}</Text>
              <Text style={styles.resultText}>Accuracy: {((successCount / MAX_CARDS) * 100).toFixed(1)}%</Text>
            </View>
            <TouchableOpacity style={styles.restartButton} onPress={restartGame}>
              <Text style={styles.restartButtonText}>Restart Game</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cards.slice(currentIndex, currentIndex + 3).map((card, index) => (
            <SwipeableCard
              key={card.id}
              color={card.color}
              onSwipe={handleSwipe}
              index={index}
              targetDirection={card.targetDirection}
            />
          ))
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  startTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00FFFF',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  startSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: '#00FFFF',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00FFFF',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  completionSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  resultsContainer: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
  resultText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  restartButton: {
    backgroundColor: '#00FFFF',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  restartButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
});
