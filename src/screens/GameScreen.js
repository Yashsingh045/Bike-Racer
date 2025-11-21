// src/screens/GameScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, Animated, Easing, TouchableOpacity, Image } from 'react-native'; 
import { Accelerometer } from 'expo-sensors';

// --- Import Logic & Constants (Casing FIXED) ---
import { 
    createCar, createFuelBottle, createTree, 
    ROAD_START_X, ROAD_ABS_WIDTH, LANE_MIN_X, LANE_MAX_X, BIKE_WIDTH, BIKE_HEIGHT, LANE_WIDTH, 
    BASE_SPEED, BOOST_SPEED, BOOST_DURATION_MS, BOOST_COOLDOWN_MS, TILT_SENSITIVITY, 
    CAR_SPAWN_THRESHOLD, MAX_FUEL, FUEL_DECREASE_RATE, BOOST_FUEL_MULTIPLIER, 
    FUEL_PICKUP_AMOUNT, FUEL_SPAWN_INTERVAL, CRASH_DELAY_MS, ROAD_SCROLL_HEIGHT, 
    GROUND_FULL_HEIGHT, GROUND_SCROLL_SPEED_MULTIPLIER, TREE_SPAWN_INTERVAL, 
    TREE_SCROLL_SPEED_MULTIPLIER
} from '../utils/GameLogic'; 

// --- Import Components ---
import PlayerBike from '../components/PlayerBike';
import CarEntity from '../components/CarEntity';
import FuelBottle from '../components/FuelBottle';
import TreePlant from '../components/TreePlant';
import GameOverlay from '../components/GameOverlay';

// --- Fixed Assets ---
const RoadImage = require('../../assets/road2.png'); 
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- GameScreen Component ---
export default function GameScreen() {
  // --- CORE REACTIVE STATE ---
  const [entities, setEntities] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [running, setRunning] = useState(true);
  const [fuel, setFuel] = useState(MAX_FUEL); 
  const [gameStarted, setGameStarted] = useState(false);
  
  // Player X position state
  const bikeXAnim = useRef(new Animated.Value(SCREEN_WIDTH / 2 - BIKE_WIDTH / 2)).current;
  const [bikeX, setBikeX] = useState(SCREEN_WIDTH / 2 - BIKE_WIDTH / 2);
  
  // Road Scrolling State
  const roadYAnim = useRef(new Animated.Value(0)).current; 
  const [roadYOffset, setRoadYOffset] = useState(0); 

  // Ground Scrolling State
  const groundYAnim = useRef(new Animated.Value(0)).current;
  const [groundYOffset, setGroundYOffset] = useState(0);
  
  // Tree/Plant State
  const [trees, setTrees] = useState([]);
  const [distanceTraveledSinceLastTreeSpawn, setDistanceTraveledSinceLastTreeSpawn] = useState(0); 
  
  // Spawn Timer State 
  const [distanceTraveledSinceLastCarSpawn, setDistanceTraveledSinceLastCarSpawn] = useState(0);
  const [distanceTraveledSinceLastFuelSpawn, setDistanceTraveledSinceLastFuelSpawn] = useState(0); 
  
  // --- NON-REACTIVE HANDLES ---
  const gameLoopRef = useRef(null);
  const boostTimeoutRef = useRef(null);
  const cooldownTimeoutRef = useRef(null);
  const crashTimeoutRef = useRef(null); 

  const [lastFrameTime, setLastFrameTime] = useState(performance.now());


  // --- ACCELEROMETER LOGIC ---
  useEffect(() => {
    if (gameOver || !running || !gameStarted) return;

    Accelerometer.setUpdateInterval(8); 

    const subscription = Accelerometer.addListener(accelerometerData => {
      const { x } = accelerometerData;
      const dx = -x * TILT_SENSITIVITY;
      
      setBikeX(prevX => {
        let newX = prevX + dx;
        newX = Math.max(LANE_MIN_X, Math.min(newX, LANE_MAX_X));
        
        Animated.timing(bikeXAnim, {
          toValue: newX,
          duration: 40,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start();
        
        return newX; 
      });
    });

    return () => subscription.remove();
  }, [gameOver, running, gameStarted, bikeXAnim]); 

  // --- START / GAME OVER LOGIC ---
  const handleStartGame = useCallback(() => {
    setGameStarted(true);
    setRunning(true);
  }, []);

  const showGameOverScreen = useCallback(() => {
    setGameOver(true);
  }, []);

  const handleGameOver = useCallback(() => {
    setRunning(false);

    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    clearTimeout(boostTimeoutRef.current);
    clearTimeout(cooldownTimeoutRef.current);

    // The delay CRASH_DELAY_MS is intentional to show the crash animation before the overlay
    crashTimeoutRef.current = setTimeout(showGameOverScreen, CRASH_DELAY_MS);
  }, [showGameOverScreen]);

  const handleRestart = useCallback(() => {
    setRunning(true);
    setGameOver(false);
    setScore(0);
    setEntities([]);
    setIsBoosting(false);
    setIsCooldown(false);
    setFuel(MAX_FUEL); 
    
    setGameStarted(true); 
    
    clearTimeout(crashTimeoutRef.current); 

    const initialX = SCREEN_WIDTH / 2 - BIKE_WIDTH / 2;
    setBikeX(initialX);
    bikeXAnim.setValue(initialX);
    
    setRoadYOffset(0);
    roadYAnim.setValue(0);
    
    setGroundYOffset(0);
    groundYAnim.setValue(0);
    
    setTrees([]);
    setDistanceTraveledSinceLastTreeSpawn(0);
    
    setDistanceTraveledSinceLastCarSpawn(0);
    setDistanceTraveledSinceLastFuelSpawn(0);
    setLastFrameTime(performance.now());
  }, [bikeXAnim, roadYAnim, groundYAnim]);
  
  // --- BOOST LOGIC ---
  const handleBoost = useCallback(() => {
    if (gameOver || isBoosting || isCooldown || !running || !gameStarted) return;

    setIsBoosting(true);
    clearTimeout(boostTimeoutRef.current);
    clearTimeout(cooldownTimeoutRef.current);

    boostTimeoutRef.current = setTimeout(() => {
      setIsBoosting(false);
      setIsCooldown(true);
      
      cooldownTimeoutRef.current = setTimeout(() => {
        setIsCooldown(false);
      }, BOOST_COOLDOWN_MS);
    }, BOOST_DURATION_MS);
  }, [gameOver, isBoosting, isCooldown, running, gameStarted]); 

  useEffect(() => {
    return () => {
      clearTimeout(boostTimeoutRef.current);
      clearTimeout(cooldownTimeoutRef.current);
      clearTimeout(crashTimeoutRef.current);
    };
  }, []);


  // --- GAME LOOP ---
  const updateGame = useCallback((time) => {
    if (!running || !gameStarted) return; 

    const delta = time - lastFrameTime;

    if (delta < 1000 / 60) { 
        gameLoopRef.current = requestAnimationFrame(updateGame);
        return;
    }
    
    setLastFrameTime(time);

    const currentSpeed = isBoosting ? BOOST_SPEED : BASE_SPEED;
    
    // 1. SCROLLING LOGIC
    setRoadYOffset(prevY => {
      let newY = prevY + currentSpeed;
      if (newY >= ROAD_SCROLL_HEIGHT) {
        newY = newY % ROAD_SCROLL_HEIGHT; 
      }
      roadYAnim.setValue(newY); 
      return newY;
    });
    
    setGroundYOffset(prevY => {
      let newY = prevY + (currentSpeed * GROUND_SCROLL_SPEED_MULTIPLIER);
      if (newY >= GROUND_FULL_HEIGHT) { 
        newY = newY % GROUND_FULL_HEIGHT; 
      }
      groundYAnim.setValue(newY);
      return newY;
    });
    
    // 2. TREE MOVEMENT & SPAWNING
    const treeSpeed = currentSpeed * TREE_SCROLL_SPEED_MULTIPLIER;
    setTrees(prevTrees => {
        const nextTrees = [];
        for (const tree of prevTrees) {
            tree.y += treeSpeed;
            if (tree.y < SCREEN_HEIGHT) { 
                nextTrees.push(tree);
            }
        }
        return nextTrees;
    });

    setDistanceTraveledSinceLastTreeSpawn(prevDist => {
        const newDist = prevDist + currentSpeed;
        if (newDist >= TREE_SPAWN_INTERVAL) {
            setTrees(prevTrees => [...prevTrees, createTree()]);
            return 0;
        }
        return newDist;
    });

    // 3. FUEL CONSUMPTION
    const fuelConsumption = FUEL_DECREASE_RATE * (isBoosting ? BOOST_FUEL_MULTIPLIER : 1);
    
    setFuel(prevFuel => {
        const nextFuel = Math.max(0, prevFuel - fuelConsumption);
        
        if (nextFuel === 0 && running) {
             setTimeout(handleGameOver, 0); 
        }
        return nextFuel;
    });
    
    // 4. ENTITY MOVEMENT & COLLISION
    
    // --- COLLISION TUNING CONSTANTS (ADJUSTED FOR VISUAL SWEET SPOT) ---
    // Reduced trimming to make the bounding boxes larger and delay the collision trigger
    const BIKE_H_PAD = 5;      // Trim 8px from left/right of bike hitbox (Reduced from 10)
    const BIKE_V_TRIM_TOP = 30; // Trim 15px from top of bike hitbox (Reduced from 20)
    const BIKE_V_TRIM_BOTTOM = 30; // Trim 8px from bottom of bike hitbox (Reduced from 10)
    
    const CAR_H_PAD = -10;        // Trim 3px from left/right of car hitbox (Reduced from 5)
    const CAR_V_TRIM_BOTTOM = 70; // Trim 20px from bottom of car hitbox (Reduced from 30)
    const FUEL_PADDING = 5; 
    // ------------------------------------------------------------------
    
    setEntities(prevEntities => {
      const nextEntities = [];
      let newScore = 0;
      let crashed = false;
      let fuelRefill = 0; 

      // TIGHTER BIKE BOUNDING BOX
      const bikeBounds = {
        x1: bikeX + BIKE_H_PAD, 
        y1: SCREEN_HEIGHT - BIKE_HEIGHT - 20 + BIKE_V_TRIM_TOP,
        x2: bikeX + BIKE_WIDTH - BIKE_H_PAD,
        y2: SCREEN_HEIGHT - 20 - BIKE_V_TRIM_BOTTOM,
      };
      
      // --- COLLISION AVOIDANCE CHECK: DETERMINE OCCUPIED LANES ---
      const spawnYThreshold = SCREEN_HEIGHT * 0.15; 

      const isLaneOccupied = {
        lane0: false, // Left Lane
        lane1: false, // Right Lane
      };
      
      for (const entity of prevEntities) {
          if (entity.y < spawnYThreshold && entity.type === 'car') {
              const middleX = entity.x + entity.width / 2;
              const isLeftLane = middleX < ROAD_START_X + LANE_WIDTH;

              if (isLeftLane) {
                  isLaneOccupied.lane0 = true;
              } else {
                  isLaneOccupied.lane1 = true;
              }
          }
          
          // --- EXISTING MOVEMENT AND COLLISION LOGIC ---
          entity.y += currentSpeed;
          
          // TIGHTER ENTITY BOUNDING BOX
          let xPadding = 0;
          let yTrimBottom = 0;

          if (entity.type === 'car') {
              xPadding = CAR_H_PAD;
              yTrimBottom = CAR_V_TRIM_BOTTOM;
          } else if (entity.type === 'fuel') {
              xPadding = FUEL_PADDING;
              yTrimBottom = FUEL_PADDING;
          }

          const entityBounds = {
              x1: entity.x + xPadding, 
              y1: entity.y, 
              x2: entity.x + entity.width - xPadding, 
              y2: entity.y + entity.height - yTrimBottom, 
          };
          
          // AABB Collision Check
          const collided = (
              bikeBounds.x1 < entityBounds.x2 && bikeBounds.x2 > entityBounds.x1 &&
              bikeBounds.y1 < entityBounds.y2 && bikeBounds.y2 > entityBounds.y1
          );

          if (collided) {
              if (entity.type === 'car') {
                  crashed = true;
              } else if (entity.type === 'fuel') {
                  fuelRefill += FUEL_PICKUP_AMOUNT;
                  continue; // Do not add fuel back to nextEntities
              }
          }

          if (entity.y > SCREEN_HEIGHT) {
            if (entity.type === 'car') newScore++; 
          } else {
            nextEntities.push(entity);
          }
      }
      
      // Apply Fuel Refill
      if (fuelRefill > 0) {
          setFuel(prevFuel => Math.min(MAX_FUEL, prevFuel + fuelRefill));
      }

      // --- SMART SPAWNING LOGIC ---
      let spawnedNewCar = false;
      
      // Check for Car Spawn (Car has higher spawn priority)
      setDistanceTraveledSinceLastCarSpawn(prevDist => {
        const newDist = prevDist + currentSpeed;
        if (newDist >= CAR_SPAWN_THRESHOLD) {
            const potentialCar = createCar(); 
            const middleX = potentialCar.x + potentialCar.width / 2;
            const isLeftLane = middleX < ROAD_START_X + LANE_WIDTH;

            // Only spawn if the target lane is free at the spawn threshold
            if ((isLeftLane && !isLaneOccupied.lane0) || (!isLeftLane && !isLaneOccupied.lane1)) {
                nextEntities.push(potentialCar);
                spawnedNewCar = true;
                return 0; // Reset spawn distance
            }
            return newDist;
        }
        return newDist;
      });
      
      // Check for Fuel Spawn (Only if a car wasn't just spawned)
      if (!spawnedNewCar) {
          setDistanceTraveledSinceLastFuelSpawn(prevDist => {
            const newDist = prevDist + currentSpeed;
            if (newDist >= FUEL_SPAWN_INTERVAL) {
                if (Math.random() > 0.5) { 
                    const potentialFuel = createFuelBottle();
                    const middleX = potentialFuel.x + potentialFuel.width / 2;
                    const isLeftLane = middleX < ROAD_START_X + LANE_WIDTH;

                    // Only spawn if the target lane is free at the spawn threshold
                    if ((isLeftLane && !isLaneOccupied.lane0) || (!isLeftLane && !isLaneOccupied.lane1)) {
                        nextEntities.push(potentialFuel);
                        return 0; // Reset spawn distance
                    }
                }
                return newDist;
            }
            return newDist;
          });
      }

      // Update Game State
      if (crashed) {
        handleGameOver(); 
        return prevEntities; 
      }
      
      setScore(s => s + newScore);
      return nextEntities;
    });
    
    gameLoopRef.current = requestAnimationFrame(updateGame);
  }, [running, gameStarted, isBoosting, bikeX, handleGameOver, lastFrameTime, roadYAnim, groundYAnim]); 
  
  // Start/Stop Game Loop Effect
  useEffect(() => {
    if (running && !gameOver && gameStarted) {
      gameLoopRef.current = requestAnimationFrame(updateGame);
    } else if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    return () => {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [updateGame, running, gameOver, gameStarted]); 
  
  // --- RENDERING HANDLERS ---
  
  const renderEntities = () => entities.map(entity => {
    if (entity.type === 'car') {
        return <CarEntity key={entity.id} entity={entity} running={running} />;
    } else if (entity.type === 'fuel') {
        return <FuelBottle key={entity.id} entity={entity} running={running} />;
    }
  });

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.fullScreenPressable} 
        onPress={handleBoost} 
        disabled={gameOver || !running || !gameStarted}
      >
          
          {/* 0. Full Screen Scrolling Ground/Background */}
          <View style={styles.fullGroundContainer}>
            <Animated.View style={[styles.fullGroundView, { transform: [{ translateY: groundYAnim }] }]}>
                <View style={styles.fullGroundSegment} />
                <View style={styles.fullGroundSegment} />
                <View style={styles.fullGroundSegment} />
            </Animated.View>
          </View>
          
          {/* 1. Roadside Trees/Plants Layer (Component) */}
          {trees.map(tree => <TreePlant key={tree.id} tree={tree} />)}
          
          {/* 2. Road Background */}
          <Animated.View style={[styles.roadContainer, { transform: [{ translateY: roadYAnim }] }]}>
            <View style={styles.centerLaneMarker} />
            <Image source={RoadImage} style={styles.roadImage} resizeMode="cover"/>
            <Image source={RoadImage} style={styles.roadImage} resizeMode="cover"/>
            <Image source={RoadImage} style={styles.roadImage} resizeMode="cover"/>
          </Animated.View>
          
          {/* 3. Game Entities (Cars and Fuel) */}
          {gameStarted && renderEntities()}

          {/* 4. Player Bike (Component) */}
          <PlayerBike bikeXAnim={bikeXAnim} isBoosting={isBoosting} />

          {/* 5. UI Overlays (Component) */}
          {gameStarted && (
            <GameOverlay 
                score={score} 
                fuel={fuel} 
                isBoosting={isBoosting} 
                isCooldown={isCooldown}
            />
          )}

          {/* 6. Game Over Screen */}
          {gameOver && (
            <View style={styles.gameOverOverlay}>
              <Text style={styles.gameOverText}>
                {fuel === 0 ? 'OUT OF FUEL!' : 'CRASHED!'}
              </Text>
              <Text style={styles.finalScoreText}>Final Score: {score}</Text>
              <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
                <Text style={styles.restartButtonText}>RESTART</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* 7. Start Game Screen */}
          {!gameStarted && !gameOver && (
            <View style={styles.gameOverOverlay}>
                <Text style={styles.gameOverText}>BIKE RACER</Text>
                <Text style={styles.startInfoText}>
                    Instructions:
                    </Text>
                    <Text style={styles.startInfoText}>
                    1. Tilt phone right to steer right.
                    </Text>
                    <Text style={styles.startInfoText}>
                    2. Tilt phone left to steer left.
                    </Text>
                    <Text style={styles.startInfoText}>
                    3. Tap screen to boost speed!
                </Text>
                <TouchableOpacity style={styles.restartButton} onPress={handleStartGame}>
                    <Text style={styles.restartButtonText}>START GAME</Text>
                </TouchableOpacity>
            </View>
          )}
        </Pressable>
    </View>
  );
}

// --- STYLES (Only styles for fixed elements and screens) ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3C6B3C', 
  },
  fullScreenPressable: {
    flex: 1,
  },
  fullGroundContainer: {
    position: 'absolute',
    top: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    overflow: 'hidden',
    zIndex: 0, 
  },
  fullGroundView: {
    position: 'absolute',
    top: -GROUND_FULL_HEIGHT, 
    width: '100%',
    height: GROUND_FULL_HEIGHT * 3, 
  },
  fullGroundSegment: {
    width: '100%',
    height: GROUND_FULL_HEIGHT,
    backgroundColor: '#3C6B3C', 
    borderTopColor: '#2E592E', 
    borderTopWidth: 1,
    borderBottomColor: '#2E592E',
    borderBottomWidth: 1,
  },
  roadContainer: {
    position: 'absolute',
    top: -SCREEN_HEIGHT, 
    left: ROAD_START_X,
    width: ROAD_ABS_WIDTH,
    height: SCREEN_HEIGHT * 3, 
    zIndex: 1, 
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderColor: 'white',
  },
  roadImage: { 
    width: '100%', 
    height: SCREEN_HEIGHT, 
  },
  centerLaneMarker: {
    position: 'absolute',
    left: ROAD_ABS_WIDTH / 2 - 2.5, 
    top: 0,
    width: 5,
    height: '100%', 
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderStyle: 'dashed',
    borderColor: 'transparent',
    borderLeftWidth: 3, 
    zIndex: 2, 
  },
  // --- Game Over/Start Overlay Styles ---
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  gameOverText: {
    color: 'red',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  finalScoreText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 5,
    marginTop: 10,
  },
  startInfoText: {
    color: 'white',
    fontSize: 20,
    marginBottom: 40,
    textAlign: 'center',
  },
  restartButton: {
    backgroundColor: '#00BFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  restartButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  }
});