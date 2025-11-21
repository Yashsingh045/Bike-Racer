// src/components/CarEntity.js
import React from 'react';
import { Image, StyleSheet } from 'react-native';

const CarEntity = ({ entity, running }) => {
  const entityStyle = {
    position: 'absolute',
    left: entity.x,
    top: entity.y,
    width: entity.width,
    height: entity.height,
    opacity: running ? 1 : 0.8, 
    zIndex: 15, 
  };
  
  // Note: entity.imageSource comes from gameLogic.js -> createCar
  return (
    <Image
      key={entity.id}
      source={entity.imageSource} 
      style={entityStyle}
      resizeMode="contain" 
    />
  );
};

export default CarEntity;