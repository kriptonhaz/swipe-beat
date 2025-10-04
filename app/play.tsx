import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CardProgressIndicator } from "../components/CardProgressIndicator";
import { SwipeableCard } from "../components/SwipeableCard";

// TypeScript interfaces for rhythm game
interface BeatMatch {
  direction: "left" | "right" | "up" | "down";
  beatTime: number;
}

interface Sequence {
  time: number;
  pattern: ("left" | "right" | "up" | "down")[];
  beatMatch: BeatMatch;
}

interface Beatmap {
  song: string;
  bpm: number;
  startOffset: number;
  sequences: Sequence[];
}

interface RhythmCard {
  id: string;
  color: string;
  targetDirection: "left" | "right" | "up" | "down";
  status: "pending" | "correct" | "incorrect";
  isBeatMatch: boolean;
}

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

// Example beatmap data
const beatmap: Beatmap = {
  song: "bep-where-is-the-love.mp3",
  bpm: 94,
  startOffset: 8.0,
  sequences: [
    {
      time: 8.1,
      pattern: ["left", "up", "right", "down"],
      beatMatch: {
        direction: "up",
        beatTime: 12.5,
      },
    },
    {
      time: 13.2,
      pattern: ["right", "left", "up", "down", "left", "right"],
      beatMatch: {
        direction: "down",
        beatTime: 17.8,
      },
    },
  ],
};

export default function PlayScreen() {
  const [gamePhase, setGamePhase] = useState<"ready" | "playing" | "completed">(
    "ready"
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [waitingStartTime, setWaitingStartTime] = useState<number | null>(null);

  const [sequenceCards, setSequenceCards] = useState<RhythmCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [beatMatchScore, setBeatMatchScore] = useState({ hits: 0, misses: 0 });
  const [readyCountdown, setReadyCountdown] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);

  const timeIntervalRef = useRef<number | null>(null);

  // Initialize audio player
  const player = useAudioPlayer(
    require("../assets/song/bep-where-is-the-love.mp3")
  );

  // Generate cards for a sequence
  const generateSequenceCards = useCallback(
    (sequence: Sequence): RhythmCard[] => {
      const cards = sequence.pattern.map((direction, index) => ({
        id: `${sequence.time}-${index}`,
        color: generateRandomColor(),
        targetDirection: direction,
        status: "pending" as const,
        isBeatMatch: false,
      }));

      // Add beat match card
      const beatMatchCard: RhythmCard = {
        id: `${sequence.time}-beatmatch`,
        color: "#FFD700", // Gold color for beat match cards
        targetDirection: sequence.beatMatch.direction,
        status: "pending" as const,
        isBeatMatch: true,
      };

      return [...cards, beatMatchCard];
    },
    []
  );

  // Check if swipe matches beat timing
  const isBeatMatch = useCallback(
    (swipeTime: number, beatTime: number): boolean => {
      const tolerance = 200; // ±200ms tolerance
      const swipeTimeSeconds = swipeTime / 1000;
      return Math.abs(swipeTimeSeconds - beatTime) <= tolerance / 1000;
    },
    []
  );

  // Start pulsation animation for beat match cards
  const startPulsation = useCallback(() => {
    setIsPulsing(true);
  }, []);

  // Configure audio and start game
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
        });

        // Start audio playback
        player.seekTo(0);
        player.play();

        // Start timing interval
        timeIntervalRef.current = setInterval(() => {
          setCurrentTime((prev) => prev + 0.1);
        }, 100);
      } catch (error) {
        console.error("Failed to configure audio mode or play audio:", error);
      }
    };

    configureAudio();

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [player]);

  // Game timing logic
  useEffect(() => {
    if (gamePhase === "ready") {
      const timeUntilStart = beatmap.startOffset - currentTime;
      setReadyCountdown(Math.max(0, Math.ceil(timeUntilStart)));

      if (currentTime >= beatmap.startOffset) {
        setGamePhase("playing");
        startPulsation();
      }
    } else if (gamePhase === "playing") {
      // Check if we need to show a new sequence
      const currentSequence = beatmap.sequences[currentSequenceIndex];

      if (
        currentSequence &&
        currentTime >= currentSequence.time &&
        sequenceCards.length === 0
      ) {
        const newCards = generateSequenceCards(currentSequence);
        setSequenceCards(newCards);
        setCurrentCardIndex(0);
        setWaitingStartTime(null);
      }

      // Check if all sequences are completed
      if (
        currentSequenceIndex >= beatmap.sequences.length &&
        sequenceCards.length === 0
      ) {
        setGamePhase("completed");

        // Stop the audio before navigating to result screen
        player.pause();

        // Navigate to result screen
        router.push({
          pathname: "/result",
          params: {
            duration: currentTime.toFixed(1),
            successCount: beatMatchScore.hits.toString(),
            failedCount: beatMatchScore.misses.toString(),
            totalCards: beatmap.sequences.length.toString(),
          },
        });
      }
    }
  }, [
    currentTime,
    gamePhase,
    currentSequenceIndex,
    sequenceCards.length,
    beatMatchScore,
    generateSequenceCards,
    startPulsation,
  ]);

  const handleSwipe = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (
        sequenceCards.length === 0 ||
        currentCardIndex >= sequenceCards.length
      )
        return;

      const currentCard = sequenceCards[currentCardIndex];
      const swipeTime = Date.now();
      const isCorrectDirection = currentCard.targetDirection === direction;

      let isCorrect = isCorrectDirection;

      // Special handling for beat match cards
      if (currentCard.isBeatMatch) {
        const currentSequence = beatmap.sequences[currentSequenceIndex];
        const isBeatTiming = isBeatMatch(
          swipeTime,
          currentSequence.beatMatch.beatTime
        );

        if (isCorrectDirection && isBeatTiming) {
          setBeatMatchScore((prev) => ({ ...prev, hits: prev.hits + 1 }));
          isCorrect = true;
        } else {
          setBeatMatchScore((prev) => ({ ...prev, misses: prev.misses + 1 }));
          isCorrect = false;
        }
      }

      // Update card status
      setSequenceCards((prev) => {
        const updated = [...prev];
        updated[currentCardIndex] = {
          ...updated[currentCardIndex],
          status: isCorrect ? "correct" : "incorrect",
        };
        return updated;
      });

      // Move to next card immediately
      const nextIndex = currentCardIndex + 1;
      setCurrentCardIndex(nextIndex);

      // If sequence is completed, move pointer to the next sequence and let timing logic load it when appropriate
      if (nextIndex >= sequenceCards.length) {
        const nextSequenceIndex = currentSequenceIndex + 1;
        const nextSequence = beatmap.sequences[nextSequenceIndex];

        // Always advance the sequence index so we don't reload the finished sequence
        setCurrentSequenceIndex(nextSequenceIndex);

        if (nextSequence && currentTime >= nextSequence.time) {
          // If the next sequence's time has already been reached, load it immediately
          const newCards = generateSequenceCards(nextSequence);
          setSequenceCards(newCards);
          setCurrentCardIndex(0);
          setWaitingStartTime(null);
        } else {
          // Otherwise clear cards and wait for the useEffect timing logic to load when time is reached
          setSequenceCards([]);
          setCurrentCardIndex(0);
          if (nextSequence) {
            setWaitingStartTime(currentTime);
          } else {
            setWaitingStartTime(null);
          }
        }
      }
    },
    [sequenceCards, currentCardIndex, currentSequenceIndex, isBeatMatch]
  );

  // Prepare progress indicator data
  const progressCards = sequenceCards.map((card, index) => ({
    id: card.id,
    status: (index === currentCardIndex ? "current" : card.status) as
      | "pending"
      | "correct"
      | "incorrect"
      | "current",
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      {gamePhase === "ready" ? (
        <View style={styles.readyContainer}>
          <Text style={styles.readyTitle}>Get Ready!</Text>
          <Text style={styles.readySubtitle}>
            {readyCountdown > 0
              ? `Starting in ${readyCountdown}...`
              : "Let's Go!"}
          </Text>
          <View style={styles.beatmapInfo}>
            <Text style={styles.beatmapText}>Song: {beatmap.song}</Text>
            <Text style={styles.beatmapText}>BPM: {beatmap.bpm}</Text>
            <Text style={styles.beatmapText}>
              Sequences: {beatmap.sequences.length}
            </Text>
          </View>
        </View>
      ) : gamePhase === "playing" ? (
        <>
          <CardProgressIndicator
            cards={progressCards}
            currentIndex={currentCardIndex}
            maxVisible={6}
          />
          <View style={styles.cardContainer}>
            {sequenceCards.length > 0 &&
              currentCardIndex < sequenceCards.length && (
                <SwipeableCard
                  key={sequenceCards[currentCardIndex].id}
                  color={sequenceCards[currentCardIndex].color}
                  onSwipe={handleSwipe}
                  index={0}
                  targetDirection={
                    sequenceCards[currentCardIndex].targetDirection
                  }
                  isBeatMatch={sequenceCards[currentCardIndex].isBeatMatch}
                  isPulsing={
                    sequenceCards[currentCardIndex].isBeatMatch && isPulsing
                  }
                />
              )}
            {sequenceCards.length === 0 && currentSequenceIndex < beatmap.sequences.length && (
              (() => {
                const nextSequence = beatmap.sequences[currentSequenceIndex];
                const targetTime = nextSequence?.time ?? currentTime;
                const anchorTime =
                  waitingStartTime !== null
                    ? waitingStartTime
                    : currentSequenceIndex > 0
                    ? beatmap.sequences[currentSequenceIndex - 1].time
                    : beatmap.startOffset;
                const totalWait = Math.max(0.0001, targetTime - anchorTime);
                const elapsed = Math.max(0, currentTime - anchorTime);
                const ratio = Math.max(0, Math.min(1, elapsed / totalWait));
                const remaining = Math.max(0, targetTime - currentTime);
                return (
                  <View style={styles.waitingContainer}>
                    <Text style={styles.waitingTitle}>Next sequence incoming…</Text>
                    <Text style={styles.waitingSubtitle}>
                      Starts in {remaining.toFixed(1)}s
                    </Text>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
                    </View>
                  </View>
                );
              })()
            )}
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>
              Beat Hits: {beatMatchScore.hits}
            </Text>
            <Text style={styles.scoreText}>
              Beat Misses: {beatMatchScore.misses}
            </Text>
          </View>
        </>
      ) : null}
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
  readyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  readyTitle: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#00FFFF",
    textAlign: "center",
    marginBottom: 16,
    textShadowColor: "#00FFFF",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  readySubtitle: {
    fontSize: 24,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 40,
  },
  beatmapInfo: {
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  beatmapText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "600",
  },
  scoreContainer: {
    position: "absolute",
    top: 100,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 10,
    borderRadius: 10,
  },
  scoreText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  waitingContainer: {
    width: '80%',
    alignItems: 'center',
    gap: 10,
  },
  waitingTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  waitingSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00FFFF',
  },
});
