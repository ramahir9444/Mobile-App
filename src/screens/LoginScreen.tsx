import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Theme } from '../constants/theme';
import { sendOtp } from '../services/api';

export const LoginScreen: React.FC = () => {
  const { navigateTo, authPhone, setAuthPhone } = useApp();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleContinue = async () => {
    if (authPhone.length !== 10) return;
    setError(null);
    setLoading(true);
    try {
      const res = await sendOtp(authPhone);
      if (res.success) {
        navigateTo('OTP');
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

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
          {/* Simulated ambient glow backdrops */}
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

          {/* Main Content Card Container */}
          <View className="w-full px-2">
            <View 
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                paddingHorizontal: 24,
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
              {/* Form Title */}
              <Text 
                style={{ 
                  fontFamily: Theme.fonts.poppinsBold, 
                  fontSize: 19, 
                  color: '#1E293B' 
                }}
                className="mb-6 font-bold"
              >
                Log in/Sign up
              </Text>

              {/* Phone Pill-shaped Input Container */}
              <View 
                className="flex-row items-center rounded-full px-5 mb-6 h-[54px] border border-transparent"
                style={{
                  backgroundColor: '#F3F4F6',
                }}
              >
                <Text 
                  style={{ 
                    fontFamily: Theme.fonts.poppinsMedium, 
                    fontSize: 15, 
                    color: '#1E293B', 
                    marginRight: 6 
                  }}
                  className="font-medium"
                >
                  +91
                </Text>
                
                {/* Visual Cursor/Divider */}
                <View 
                  style={{ 
                    width: 1.5, 
                    height: 18, 
                    backgroundColor: '#00B6A6', 
                    marginRight: 10 
                  }} 
                />

                <TextInput
                  value={authPhone}
                  onChangeText={(val) => {
                    // Allow only integers up to 10 digits
                    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 10);
                    setAuthPhone(cleaned);
                  }}
                  placeholder="Mobile Number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  className="flex-1 text-[#1E293B] text-[15px]"
                  style={{
                    fontFamily: Theme.fonts.poppinsMedium,
                    paddingVertical: 0,
                  }}
                />
              </View>

              {/* Error message */}
              {error && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: -4 }}>
                  <Feather name="alert-circle" size={13} color="#EF4444" style={{ marginRight: 5 }} />
                  <Text style={{ fontFamily: Theme.fonts.poppinsRegular, fontSize: 12, color: '#EF4444', flex: 1 }}>
                    {error}
                  </Text>
                </View>
              )}

              {/* Action Continue Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={authPhone.length < 10 || loading}
                onPress={handleContinue}
                style={{
                  backgroundColor: authPhone.length === 10 ? '#00B6A6' : '#BCEFE8',
                  borderRadius: 9999,
                  height: 50,
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  shadowColor: authPhone.length === 10 ? '#00B6A6' : 'transparent',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: authPhone.length === 10 ? 0.2 : 0,
                  shadowRadius: 6,
                  elevation: authPhone.length === 10 ? 3 : 0,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text 
                    style={{ 
                      fontFamily: Theme.fonts.poppinsBold, 
                      fontSize: 16, 
                      color: '#FFFFFF' 
                    }}
                    className="font-bold"
                  >
                    Continue
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Skip Option */}
            <TouchableOpacity 
              onPress={() => navigateTo('DASHBOARD')} 
              className="py-4 mt-2 self-center"
            >
              <Text 
                style={{ 
                  fontFamily: Theme.fonts.poppinsMedium, 
                  fontSize: 14, 
                  color: '#94A3B8' 
                }}
                className="text-center font-medium"
              >
                Later
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Brand & Policy Section */}
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
    </KeyboardAvoidingView>
  );
};

