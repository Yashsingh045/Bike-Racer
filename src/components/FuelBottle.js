// src/components/FuelBottle.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FuelBottle = ({ entity, running }) => {
  const entityStyle = {
    position: 'absolute',
    left: entity.x,
    top: entity.y,
    width: entity.width,
    height: entity.height,
    opacity: running ? 1 : 0.8, 
    zIndex: 15, 
  };
  
  return (
    <View
      key={entity.id}
      style={[
        entityStyle, 
        styles.fuelBottleView
      ]}>
      <Text style={styles.fuelBottleText}>⛽</Text>
    </View>
  );
};

const styles = StyleSheet.create({
    fuelBottleView: {
        backgroundColor: '#FFD700', // Gold/Yellow
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#FFA500', // Orange
        alignItems: 'center',
        justifyContent: 'center',
    },
    fuelBottleText: {
        fontSize: 20, 
        textAlign: 'center'
    }
});

export default FuelBottle;