// src/components/GameOverlay.js
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
// Import MAX_FUEL and the base percentage constant
import { MAX_FUEL, ROAD_WIDTH_PERCENT } from '../utils/GameLogic.js'; 

// Recalculate derived constants needed for styling locally
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ROAD_ABS_WIDTH = SCREEN_WIDTH * ROAD_WIDTH_PERCENT;
const ROAD_START_X = (SCREEN_WIDTH - ROAD_ABS_WIDTH) / 2;

const GameOverlay = ({ score, fuel, isBoosting, isCooldown }) => {
    const fuelBarWidth = (fuel / MAX_FUEL) * ROAD_ABS_WIDTH;
    const fuelColor = fuel > 30 ? 'green' : fuel > 10 ? 'yellow' : 'red';
    
    return (
        <>
            {/* UI Overlay (Score & Boost Status) */}
            <View style={styles.uiOverlay}>
                <Text style={styles.scoreText}>SCORE: {score}</Text>
                <Text style={[
                    styles.boostStatus, 
                    isBoosting && styles.boostActive,
                    isCooldown && styles.boostCooldown,
                ]}>
                    {isBoosting ? 'BOOSTING!' : isCooldown ? 'COOLDOWN' : 'TAP TO BOOST'}
                </Text>
            </View>

            {/* Fuel Bar */}
            <View style={styles.fuelContainer}>
                <Text style={styles.fuelLabel}>FUEL</Text>
                <View style={styles.fuelBarBackground}>
                    <View style={[
                        styles.fuelBarFill,
                        { 
                            width: fuelBarWidth, 
                            backgroundColor: fuelColor,
                        }
                    ]} />
                </View>
                <Text style={[styles.fuelValue, {color: fuelColor}]}>{Math.round(fuel)}</Text>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    uiOverlay: {
        position: 'absolute',
        top: 30,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        zIndex: 20,
    },
    scoreText: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 5,
        borderRadius: 5,
    },
    boostStatus: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'gray',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 5,
        borderRadius: 5,
    },
    boostActive: {
        color: 'yellow',
        textShadowColor: 'red',
        textShadowRadius: 3,
    },
    boostCooldown: {
        color: 'red',
    },
    fuelContainer: {
        position: 'absolute',
        top: 80,
        width: ROAD_ABS_WIDTH, // Calculated locally
        left: ROAD_START_X,     // Calculated locally
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
        zIndex: 20,
    },
    fuelLabel: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
    },
    fuelBarBackground: {
        flex: 1,
        height: 15,
        backgroundColor: '#555',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CCC',
        overflow: 'hidden',
    },
    fuelBarFill: {
        height: '100%',
        borderRadius: 8,
    },
    fuelValue: {
        marginLeft: 10,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default GameOverlay;