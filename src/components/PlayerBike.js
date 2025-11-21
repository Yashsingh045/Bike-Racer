// src/components/PlayerBike.js
import React from 'react';
import { StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { BIKE_WIDTH, BIKE_HEIGHT } from '../utils/GameLogic';

const BikeImage = require('../../assets/bike2.png'); 

const PlayerBike = ({ bikeXAnim, isBoosting }) => {
  return (
    <Animated.View
      style={[
        styles.bike,
        isBoosting && styles.bikeBoost,
        {
          transform: [{ translateX: bikeXAnim }],
        },
      ]}
    >
      <Image
        source={BikeImage}
        style={styles.bikeImage}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
    bike: {
        position: 'absolute',
        bottom: 20,
        width: BIKE_WIDTH,
        height: BIKE_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    bikeImage: {
        width: '100%',
        height: '100%',
    },
    bikeBoost: {
        opacity: 0.8, 
    },
});

export default PlayerBike;