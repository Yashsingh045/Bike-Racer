// src/components/TreePlant.js
import React from 'react';
import { View, StyleSheet } from 'react-native';

const TreePlant = ({ tree }) => {
  return (
    <View
      key={tree.id}
      style={{
        position: 'absolute',
        left: tree.x,
        top: tree.y,
        width: tree.width,
        height: tree.height,
        zIndex: 5, 
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
        {/* Tree Trunk */}
        <View style={{
            width: tree.width * 0.3,
            height: tree.trunkHeight,
            backgroundColor: '#8B4513', 
            borderRadius: tree.width * 0.15,
            position: 'absolute',
            bottom: 0,
        }} />
        {/* Tree Canopy/Leaves */}
        <View style={{
            width: tree.canopyWidth,
            height: tree.canopyHeight,
            backgroundColor: tree.canopyColor,
            borderRadius: tree.canopyWidth / 2,
            position: 'absolute',
            top: 0,
            left: tree.width / 2 - tree.canopyWidth / 2, 
        }} />
    </View>
  );
};


export default TreePlant;