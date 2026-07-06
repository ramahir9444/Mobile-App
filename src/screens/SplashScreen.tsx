import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Theme } from '../constants/theme';

export const SplashScreen: React.FC = () => {
  const { navigateTo, user } = useApp();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Parallel animation: Fade in and spring scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 18,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-navigate based on persistent login state after 2.2 seconds
    const timer = setTimeout(() => {
      if (user && user.phone) {
        navigateTo('DASHBOARD');
      } else {
        navigateTo('LOGIN');
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [user]);

  const handlePress = () => {
    if (user && user.phone) {
      navigateTo('DASHBOARD');
    } else {
      navigateTo('LOGIN');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={{ backgroundColor: '#F4FBF9' }} className="flex-1 justify-between py-20 px-6 relative overflow-hidden">
        {/* Ambient background glows */}
        <View 
          style={{ 
            position: 'absolute', 
            top: -80, 
            left: -80, 
            width: 300, 
            height: 300, 
            borderRadius: 150, 
            backgroundColor: '#E0F2FE', 
            opacity: 0.6 
          }} 
          blurRadius={80} 
        />
        <View 
          style={{ 
            position: 'absolute', 
            bottom: '20%', 
            right: -100, 
            width: 280, 
            height: 280, 
            borderRadius: 140, 
            backgroundColor: '#E2FBF6', 
            opacity: 0.8 
          }} 
          blurRadius={85} 
        />

        {/* Spacer */}
        <View />

        {/* Brand Logo & Animations in Center */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: 'center',
          }}
        >
          <View className="flex-row items-end justify-center relative px-4">
            <Text 
              style={{ 
                fontFamily: Theme.fonts.poppinsBold, 
                fontSize: 64, 
                color: '#00B6A6', 
                letterSpacing: -2 
              }}
              className="font-bold tracking-tighter"
            >
              oda
            </Text>
            {/* Custom tiny orange arrow above 'a' */}
            <View 
              style={{ 
                position: 'absolute', 
                right: -2, 
                top: 12 
              }}
            >
              <Feather name="arrow-up-right" size={32} color="#FF9100" strokeWidth={3.5} />
            </View>
          </View>
          <Text 
            style={{ 
              fontFamily: Theme.fonts.poppinsMedium, 
              fontSize: 15, 
              color: '#475569', 
              fontStyle: 'italic', 
              letterSpacing: 0.8 
            }}
            className="mt-2 text-center font-medium"
          >
            Most Advanced LIVE Class
          </Text>
        </Animated.View>

        {/* Loader at bottom */}
        <View className="items-center">
          <ActivityIndicator size="small" color="#00B6A6" />
          <Text
            style={{ fontFamily: Theme.fonts.poppinsRegular }}
            className="text-[10px] text-slate-400 mt-4"
          >
            Tap anywhere to skip
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

