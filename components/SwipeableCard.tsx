import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SwipeableCardProps {
  color: string;
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void;
  index: number;
  targetDirection: 'left' | 'right' | 'up' | 'down';
}

const SWIPE_THRESHOLD = 100;
const ROTATION_THRESHOLD = 15;

export const SwipeableCard: React.FC<SwipeableCardProps> = ({ 
  color, 
  onSwipe, 
  index,
  targetDirection 
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Helper function to get arrow icon name based on direction
  const getArrowIcon = (direction: 'left' | 'right' | 'up' | 'down') => {
    switch (direction) {
      case 'left':
        return 'arrow-back' as const;
      case 'right':
        return 'arrow-forward' as const;
      case 'up':
        return 'arrow-up' as const;
      case 'down':
        return 'arrow-down' as const;
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      
      // Scale down slightly when dragging
      const distance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
      scale.value = interpolate(
        distance,
        [0, 150],
        [1, 0.95],
        Extrapolate.CLAMP
      );
      
      // Fade out as card moves away
      opacity.value = interpolate(
        distance,
        [0, 200],
        [1, 0.7],
        Extrapolate.CLAMP
      );
    })
    .onEnd((event) => {
      const { translationX, translationY, velocityX, velocityY } = event;
      
      // Determine swipe direction based on translation and velocity
      const absX = Math.abs(translationX);
      const absY = Math.abs(translationY);
      const absVelX = Math.abs(velocityX);
      const absVelY = Math.abs(velocityY);
      
      let shouldSwipe = false;
      let direction: 'left' | 'right' | 'up' | 'down' = 'left';
      
      // Check if swipe threshold is met
      if (absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD || absVelX > 500 || absVelY > 500) {
        shouldSwipe = true;
        
        // Determine primary direction
        if (absX > absY) {
          // Horizontal swipe
          direction = translationX > 0 ? 'right' : 'left';
        } else {
          // Vertical swipe
          direction = translationY > 0 ? 'down' : 'up';
        }
      }
      
      if (shouldSwipe) {
        // Animate card off screen
        const exitX = direction === 'left' ? -SCREEN_WIDTH * 1.5 : 
                     direction === 'right' ? SCREEN_WIDTH * 1.5 : translationX;
        const exitY = direction === 'up' ? -SCREEN_HEIGHT * 1.5 : 
                     direction === 'down' ? SCREEN_HEIGHT * 1.5 : translationY;
        
        translateX.value = withTiming(exitX, { duration: 300 });
        translateY.value = withTiming(exitY, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        scale.value = withTiming(0.8, { duration: 300 });
        
        // Call onSwipe after animation starts
        runOnJS(onSwipe)(direction);
      } else {
        // Return to center
        translateX.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(0, { duration: 300 });
        scale.value = withTiming(1, { duration: 300 });
        opacity.value = withTiming(1, { duration: 300 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2],
      [-ROTATION_THRESHOLD, ROTATION_THRESHOLD],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotateZ: `${rotation}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View 
        style={[
          styles.card, 
          { backgroundColor: color, zIndex: 1000 - index },
          animatedStyle
        ]} 
      >
        {/* Arrow Icon in the center */}
        <View style={styles.arrowContainer}>
          <Ionicons 
            name={getArrowIcon(targetDirection)}
            size={80}
            color="rgba(255, 255, 255, 0.9)"
            style={styles.arrowIcon}
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.7,
    borderRadius: 20,
  },
  arrowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});