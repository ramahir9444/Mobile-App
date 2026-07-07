import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { Theme } from '../constants/theme';
import { verifyOtp } from '../services/api';

export const OtpScreen: React.FC = () => {
  const { navigateTo, authPhone, updateUser, setSelectedClass } = useApp();

  const [code, setCode]             = useState('');
  const [timer, setTimer]           = useState(54);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-verify when 6 digits entered
  const handleTextChange = async (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(cleaned);
    setError(null);

    if (cleaned.length === 6) {
      setIsLoggingIn(true);
      try {
        const res = await verifyOtp(authPhone, cleaned);
        if (res.success && res.student) {
          try {
            await AsyncStorage.setItem('@user_phone', res.student.phone);
          } catch (err) {
            console.error('AsyncStorage save error:', err);
          }

          updateUser({
            _id: res.student._id,
            name: res.student.name || 'Student',
            phone: res.student.phone,
            email: res.student.email || '',
            avatar: res.student.profilePhoto || '',
            altPhone: res.student.altPhone || '',
            board: res.student.board || '',
            state: res.student.state || '',
            address: res.student.address || '',
          });
          if (res.student.selectedClass) {
            setSelectedClass(res.student.selectedClass);
          }
          navigateTo('DASHBOARD');
        } else {
          setError(res.error || 'Invalid OTP. Please try again.');
          setIsLoggingIn(false);
        }
      } catch (err: any) {
        setError(err.message || 'Network error. Is the server running?');
        setIsLoggingIn(false);
      }
    }
  };

  // Automatically focus the hidden input on page load
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
  }, []);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-white"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        showsVerticalScrollIndicator={false}
        className="bg-[#F4FBF9]"
        style={{ backgroundColor: '#F4FBF9' }}
      >
        <View className="flex-1 justify-between py-12 px-6 relative overflow-hidden">
          {/* Simulated ambient background glows */}
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
          />
          <View 
            style={{ 
              position: 'absolute', 
              top: '20%', 
              right: -100, 
              width: 250, 
              height: 250, 
              borderRadius: 125, 
              backgroundColor: '#E2FBF6', 
              opacity: 0.8 
            }} 
          />

          {/* Top Logo & Slogan Header Section */}
          <View className="items-center mt-12 mb-6">
            <View className="flex-row items-end justify-center relative px-4">
              <Text 
                style={{ 
                  fontFamily: Theme.fonts.poppinsBold, 
                  fontSize: 48, 
                  color: '#00B6A6', 
                  letterSpacing: -1.5 
                }}
                className="font-bold tracking-tighter"
              >
                oda
              </Text>
              {/* Custom tiny orange arrow above 'a' */}
              <View 
                style={{ 
                  position: 'absolute', 
                  right: 8, 
                  top: 12 
                }}
              >
                <Feather name="arrow-up-right" size={24} color="#FF9100" strokeWidth={3.5} />
              </View>
            </View>
            <Text 
              style={{ 
                fontFamily: Theme.fonts.poppinsMedium, 
                fontSize: 13, 
                color: '#475569', 
                fontStyle: 'italic', 
                letterSpacing: 0.5 
              }}
              className="mt-1 text-center font-medium"
            >
              Most Advanced LIVE Class
            </Text>
          </View>

          {/* Main Card Container */}
          <View className="w-full px-2">
            <View 
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                paddingHorizontal: 20,
                paddingTop: 32,
                paddingBottom: 28,
                shadowColor: '#94A3B8',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.06,
                shadowRadius: 24,
                elevation: 4,
              }}
              className="w-full"
            >
              {/* Form Title & Number verification with edit icon */}
              <View className="flex-row items-center justify-center flex-wrap mb-8">
                <Text 
                  style={{ 
                    fontFamily: Theme.fonts.poppinsMedium, 
                    fontSize: 13, 
                    color: '#475569' 
                  }}
                  className="font-medium mr-1.5"
                >
                  Enter OTP sent to{' '}
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold, color: '#1E293B' }}>
                    +91 {authPhone || '99744 83435'}
                  </Text>
                </Text>
                
                <TouchableOpacity 
                  onPress={() => navigateTo('LOGIN')} 
                  activeOpacity={0.7}
                  className="p-1"
                >
                  <Feather name="edit-2" size={13} color="#00B6A6" />
                </TouchableOpacity>
              </View>

              {/* 6 OTP Input Cells with hidden Textfield overlay */}
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={() => inputRef.current?.focus()} 
                className="flex-row justify-between mb-8 px-1 relative w-full h-[52px]"
              >
                {/* Hidden Textinput layer */}
                <TextInput
                  ref={inputRef}
                  value={code}
                  onChangeText={handleTextChange}
                  keyboardType="number-pad"
                  maxLength={6}
                  caretHidden={true}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    zIndex: 9,
                  }}
                />

                {/* Display cells */}
                {Array(6).fill(0).map((_, i) => {
                  const digit = code[i] || '';
                  const isFocused = i === code.length;
                  return (
                    <View
                      key={i}
                      style={{
                        backgroundColor: '#F3F4F6',
                        width: '14.5%',
                        height: 52,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: isFocused ? '#00B6A6' : 'transparent',
                      }}
                    >
                      <Text 
                        style={{ 
                          fontFamily: Theme.fonts.poppinsBold, 
                          fontSize: 19, 
                          color: '#1E293B' 
                        }}
                        className="font-bold text-center"
                      >
                        {digit}
                      </Text>
                    </View>
                  );
                })}
              </TouchableOpacity>

              {/* Error message */}
              {error && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8, marginTop: -4 }}>
                  <Feather name="alert-circle" size={13} color="#EF4444" style={{ marginRight: 5 }} />
                  <Text style={{ fontFamily: Theme.fonts.poppinsRegular, fontSize: 12, color: '#EF4444' }}>
                    {error}
                  </Text>
                </View>
              )}

              {/* Resend Timer Text */}
              <View className="items-center mb-2">
                {timer > 0 ? (
                  <Text 
                    style={{ 
                      fontFamily: Theme.fonts.poppinsMedium, 
                      fontSize: 13, 
                      color: '#94A3B8' 
                    }}
                    className="font-medium text-center"
                  >
                    Resend ({timer}s)
                  </Text>
                ) : (
                  <TouchableOpacity onPress={() => setTimer(54)} activeOpacity={0.7} className="py-1">
                    <Text 
                      style={{ 
                        fontFamily: Theme.fonts.poppinsBold, 
                        fontSize: 13, 
                        color: '#00B6A6' 
                      }}
                      className="font-bold text-center underline"
                    >
                      Resend
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Footer brand policy links */}
          <View className="items-center mt-6">
            <Text 
              style={{ 
                fontFamily: Theme.fonts.poppinsMedium, 
                fontSize: 11, 
                color: '#94A3B8', 
                letterSpacing: 0.8 
              }}
              className="mb-2 font-medium"
            >
              —  oda class  —
            </Text>
            
            <Text 
              style={{ 
                fontFamily: Theme.fonts.poppinsRegular, 
                fontSize: 10, 
                color: '#94A3B8', 
                textAlign: 'center', 
                lineHeight: 15,
                paddingHorizontal: 24
              }}
              className="text-center"
            >
              By Logging in You Agree Oda{' '}
              <Text 
                style={{ 
                  fontFamily: Theme.fonts.poppinsMedium, 
                  color: '#475569', 
                  textDecorationLine: 'underline' 
                }}
              >
                Terms & Conditions
              </Text>
              {' '}and{' '}
              <Text 
                style={{ 
                  fontFamily: Theme.fonts.poppinsMedium, 
                  color: '#475569', 
                  textDecorationLine: 'underline' 
                }}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Dark gray Autofill Success dialog overlay block */}
      {isLoggingIn && (
        <View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99,
          }}
        >
          <View 
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.95)',
              paddingHorizontal: 28,
              paddingVertical: 20,
              borderRadius: 16,
              alignItems: 'center',
              flexDirection: 'row',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 16 }} />
            <View>
              <Text 
                style={{ 
                  fontFamily: Theme.fonts.poppinsBold, 
                  fontSize: 15, 
                  color: '#FFFFFF' 
                }}
                className="font-bold"
              >
                Autofill success
              </Text>
              <Text 
                style={{ 
                  fontFamily: Theme.fonts.poppinsRegular, 
                  fontSize: 12, 
                  color: '#CBD5E1', 
                  marginTop: 2 
                }}
              >
                Logging in
              </Text>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

