// src/utils/gameLogic.js
import { Dimensions } from 'react-native';

// --- Global Constants ---
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const BIKE_WIDTH = 40;
export const BIKE_HEIGHT = 80;

// EXPORTED CONSTANT used by GameOverlay.js
export const ROAD_WIDTH_PERCENT = 0.85; 

// Derived constants used primarily by GameScreen.js logic
export const ROAD_ABS_WIDTH = SCREEN_WIDTH * ROAD_WIDTH_PERCENT;
export const ROAD_START_X = (SCREEN_WIDTH - ROAD_ABS_WIDTH) / 2;
export const LANE_WIDTH = ROAD_ABS_WIDTH / 2;
export const LANE_MIN_X = ROAD_START_X;
export const LANE_MAX_X = ROAD_START_X + ROAD_ABS_WIDTH - BIKE_WIDTH;

export const BASE_SPEED = 15; 
export const BOOST_SPEED = 25; 
export const BOOST_DURATION_MS = 2000; 
export const BOOST_COOLDOWN_MS = 5000; 

export const TILT_SENSITIVITY = 18; 
export const CAR_SPAWN_THRESHOLD = 350; 

// --- FUEL CONSTANTS ---
export const MAX_FUEL = 100;
export const FUEL_DECREASE_RATE = 0.15; 
export const BOOST_FUEL_MULTIPLIER = 2.5;
export const FUEL_PICKUP_AMOUNT = 30; 
export const FUEL_SPAWN_INTERVAL = 1500; 

export const CRASH_DELAY_MS = 700; 
export const ROAD_SCROLL_HEIGHT = SCREEN_HEIGHT; 

export const GROUND_FULL_HEIGHT = SCREEN_HEIGHT * 1.5; 
export const GROUND_SCROLL_SPEED_MULTIPLIER = 0.5; 

export const TREE_SPAWN_INTERVAL = 100; 
export const TREE_SCROLL_SPEED_MULTIPLIER = 1.2; 
export const MIN_TREE_WIDTH = 30;
export const MAX_TREE_WIDTH = 80;
export const MIN_TREE_HEIGHT = 80;
export const MAX_TREE_HEIGHT = 150;
// ------------------------------------------

// --- Image Imports (Keep here for utility functions) ---
export const CarImages = {
    car1: require('../../assets/car1.png'),
    car2: require('../../assets/car66.png'),
    car3: require('../../assets/car33.png'),
    car4: require('../../assets/car4.png'),
    car5: require('../../assets/car5.png'), 
    car6: require('../../assets/car6.png'), 
    car7: require('../../assets/car7.png'), 
};

// --- Entity Creation Utility ---
let entityId = 0;

export const createEntity = (type) => {
  const entityWidth = type === 'car' ? 80 : 30;
  const entityHeight = type === 'car' ? 150 : 40;
  
  const laneIndex = Math.floor(Math.random() * 2);
  const laneStartX = ROAD_START_X + (laneIndex * LANE_WIDTH);
  const laneEndX = laneStartX + LANE_WIDTH - entityWidth;
  const randomX = Math.random() * (laneEndX - laneStartX) + laneStartX;
  
  let imageSource = null;
  if (type === 'car') {
    const carKeys = Object.keys(CarImages);
    const randomKey = carKeys[Math.floor(Math.random() * carKeys.length)];
    imageSource = CarImages[randomKey];
  }
  
  return {
    id: entityId++,
    type: type,
    x: randomX,
    y: -entityHeight,
    width: entityWidth,
    height: entityHeight,
    imageSource: imageSource, 
  };
};

export const createCar = () => createEntity('car');
export const createFuelBottle = () => createEntity('fuel');

export const createTree = () => {
    const side = Math.random() < 0.5 ? 'left' : 'right';
    let x;
    const width = MIN_TREE_WIDTH + Math.random() * (MAX_TREE_WIDTH - MIN_TREE_WIDTH);
    const height = MIN_TREE_HEIGHT + Math.random() * (MAX_TREE_HEIGHT - MIN_TREE_HEIGHT);
    
    if (side === 'left') {
        x = ROAD_START_X - width - (Math.random() * 50); 
    } else {
        x = ROAD_START_X + ROAD_ABS_WIDTH + (Math.random() * 50);
    }

    const trunkHeight = height * (0.2 + Math.random() * 0.2); 
    const canopyHeight = height - trunkHeight;
    const canopyWidth = width * (0.8 + Math.random() * 0.4); 

    return {
        id: entityId++,
        type: 'tree',
        x: x,
        y: -height,
        width: width,
        height: height,
        trunkHeight: trunkHeight,
        canopyHeight: canopyHeight,
        canopyWidth: canopyWidth,
        canopyColor: `hsl(${90 + Math.floor(Math.random() * 60)}, ${40 + Math.floor(Math.random() * 30)}%, ${30 + Math.floor(Math.random() * 20)}%)`,
    };
};