import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
  StatusBar,
  StyleSheet,
  Dimensions,
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useApp } from '../context/AppContext';
import { createOrder, updateOrderStatus, getHomepageConfig, HomepageConfig } from '../services/api';


const { width, height } = Dimensions.get('window');

// ==========================================
// 1. ORDER LOADING SCREEN (Grabbing Seat)
// ==========================================
export const OrderLoadingScreen: React.FC = () => {
  const { navigateTo, goBack, selectedClass } = useApp();
  const progressAnim = useRef(new Animated.Value(0.1)).current;
  const [homeConfig, setHomeConfig] = useState<HomepageConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsConfigLoading(true);
      try {
        const res = await getHomepageConfig(selectedClass);
        if (res.success && res.data) {
          setHomeConfig(res.data);
        }
      } catch (err) {
        console.error('Failed to load class configuration:', err);
      } finally {
        setIsConfigLoading(false);
      }
    };
    fetchConfig();
  }, [selectedClass]);

  const masterPrice = homeConfig?.masterProgram?.price ?? 31999;

  useEffect(() => {
    // Animate the progress bar from 10% to 80% over 3 seconds
    Animated.timing(progressAnim, {
      toValue: 0.8,
      duration: 3000,
      useNativeDriver: false
    }).start();

    // Auto-navigate to payment screen after 3 seconds
    const timer = setTimeout(() => {
      navigateTo('ORDER_PAYMENT');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={goBack} className="p-1">
          <Feather name="chevron-left" size={26} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text 
          style={{ fontFamily: Theme.fonts.poppinsBold }}
          className="text-slate-800 text-[18px] font-bold text-center flex-1 mr-6"
        >
          Order Confirmation
        </Text>
      </View>

      <ScrollView className="flex-1 bg-slate-50 px-4 pt-4">
        {/* GRABBING SEAT BANNER */}
        <View style={styles.grabbingBanner} className="p-5 rounded-2xl flex-row items-center mb-4 relative overflow-hidden">
          <View className="absolute inset-0 bg-[#00C9A7]" />
          
          <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-4 z-10">
            <MaterialCommunityIcons name="seat-outline" size={24} color="white" />
          </View>
          
          <View className="flex-1 z-10 pr-2">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-base font-bold">
              Grabbing seat (28 seats left)...
            </Text>
            
            {/* Animated Progress Bar */}
            <View className="w-full h-1.5 bg-black/10 rounded-full mt-3 overflow-hidden">
              <Animated.View 
                style={{
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  }),
                  backgroundColor: '#FFFFFF',
                  height: '100%',
                  borderRadius: 10
                }}
              />
            </View>
          </View>
        </View>

        {/* COURSES INFO CARD */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-4">
          <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
            Courses Info
          </Text>
          
          <View className="flex-row justify-between items-start">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[14.5px] font-bold leading-snug flex-1 pr-3">
              LIVE Interactive Full Syllabus Course for {selectedClass} (2026-27)
            </Text>
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[15px] font-bold">
              ₹ {masterPrice}
            </Text>
          </View>
          
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-400 text-xs mt-3">
            15 Jun, 2026 - 6 Mar, 2027
          </Text>
        </View>

        {/* TOTAL FEE CARD */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <View className="flex-row justify-between items-center">
            <View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[15px] font-bold">
                Total Fee
              </Text>
              <Text className="text-slate-400 text-[10px] mt-0.5">
                Inclusive of all taxes
              </Text>
            </View>
            
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#00B6A6] text-xl font-bold">
              ₹ {masterPrice}.00
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ==========================================
// 2. ORDER PAYMENT SCREEN (Waiting for Payment)
// ==========================================
export const OrderPaymentScreen: React.FC = () => {
  const { navigateTo, goBack, selectedClass, setIsEnrolled, authPhone } = useApp();
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes in seconds
  const [paySheetVisible, setPaySheetVisible] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentFinished, setPaymentFinished] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [homeConfig, setHomeConfig] = useState<HomepageConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(false);

  // Fetch configs dynamically upon selectedClass changes
  useEffect(() => {
    const fetchConfig = async () => {
      setIsConfigLoading(true);
      try {
        const res = await getHomepageConfig(selectedClass);
        if (res.success && res.data) {
          setHomeConfig(res.data);
        }
      } catch (err) {
        console.error('Failed to load class configuration:', err);
      } finally {
        setIsConfigLoading(false);
      }
    };
    fetchConfig();
  }, [selectedClass]);

  const masterPrice = homeConfig?.masterProgram?.price ?? 31999;

  // Timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Create pending order immediately when payment screen opens
  useEffect(() => {
    async function initPendingOrder() {
      try {
        const savedPhone = await AsyncStorage.getItem('@user_phone');
        const phone = savedPhone || authPhone;
        if (phone) {
          const res = await createOrder({
            studentPhone: phone,
            courseTitle: `LIVE Interactive Full Syllabus Course for ${selectedClass} (2026-27)`,
            classInfo: `${selectedClass} | 15 Jun, 2026 - 6 Mar, 2027`,
            amount: String(masterPrice),
            couponDiscount: '0',
            status: 'pending',
          });
          if (res.success && res.data && res.data._id) {
            setCurrentOrderId(res.data._id);
          }
        }
      } catch (err) {
        console.error('Failed to create pending order:', err);
      }
    }
    initPendingOrder();
  }, [selectedClass, masterPrice, authPhone]);

  const formatTimer = () => {
    if (timeLeft <= 0) return '00 : 00.0';
    const mins = Math.floor(timeLeft / 60);
    const secs = Math.floor(timeLeft % 60);
    const ms = Math.floor((timeLeft % 1) * 10);
    
    const minStr = mins < 10 ? `0${mins}` : `${mins}`;
    const secStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${minStr} : ${secStr}.${ms}`;
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handlePayPress = () => {
    setPaySheetVisible(true);
  };

  const triggerPaymentProcess = async (gateway: string) => {
    setIsProcessingPayment(true);
    try {
      if (currentOrderId) {
        await updateOrderStatus(currentOrderId, 'paid');
      } else {
        const savedPhone = await AsyncStorage.getItem('@user_phone');
        const phone = savedPhone || authPhone;
        if (phone) {
          await createOrder({
            studentPhone: phone,
            courseTitle: `LIVE Interactive Full Syllabus Course for ${selectedClass} (2026-27)`,
            classInfo: `${selectedClass} | 15 Jun, 2026 - 6 Mar, 2027`,
            amount: String(masterPrice),
            couponDiscount: '0',
            status: 'paid',
          });
        }
      }
    } catch (err) {
      console.error('Failed to save order to database:', err);
    }

    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentFinished(true);
      setTimeout(() => {
        setPaySheetVisible(false);
        setPaymentFinished(false);
        setIsEnrolled(true);
        showToast("Payment Successful! Welcome to Master Program 🚀");
        // Wait and redirect back to dashboard Home
        setTimeout(() => {
          navigateTo('DASHBOARD');
        }, 1200);
      }, 1500);
    }, 2200);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={goBack} className="p-1">
          <Feather name="chevron-left" size={26} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text 
          style={{ fontFamily: Theme.fonts.poppinsBold }}
          className="text-slate-800 text-[18px] font-bold text-center flex-1 mr-6"
        >
          Order Confirmation
        </Text>
      </View>

      <ScrollView className="flex-1 bg-slate-50 px-4 pt-4">
        {/* TIMEOUT BANNER */}
        <View className="bg-[#FFF8F3] border border-orange-100 p-4 rounded-2xl flex-row items-center justify-between mb-4">
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-700 text-xs">
            Waiting for payment
          </Text>
          
          <View className="flex-row items-center bg-[#FF5E00] py-1 px-3 rounded-lg">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-[12.5px] font-bold tracking-wider">
              {formatTimer()}
            </Text>
          </View>
        </View>

        {/* COURSES INFO CARD */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-4">
          <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
            Courses Info
          </Text>
          
          <View className="flex-row justify-between items-start">
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[14.5px] font-bold leading-snug flex-1 pr-3">
              LIVE Interactive Full Syllabus Course for {selectedClass} (2026-27)
            </Text>
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[15px] font-bold">
              ₹ {masterPrice}
            </Text>
          </View>
          
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-400 text-xs mt-3">
            15 Jun, 2026 - 6 Mar, 2027
          </Text>
        </View>

        {/* TOTAL FEE CARD */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-6">
          <View className="flex-row justify-between items-center">
            <View>
              <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-[15px] font-bold">
                Total Fee
              </Text>
              <Text className="text-slate-400 text-[10px] mt-0.5">
                Inclusive of all taxes
              </Text>
            </View>
            
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-[#00B6A6] text-xl font-bold">
              ₹ {masterPrice}.00
            </Text>
          </View>
        </View>

        {/* CONTACT US */}
        <View className="px-1.5 mb-8">
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-slate-500 text-xs mb-3">
            Any questions? Contact us
          </Text>
          
          <TouchableOpacity 
            onPress={() => showToast("Calling support desk...")}
            className="bg-white border border-slate-200 py-3 px-6 rounded-xl flex-row items-center justify-center active:bg-slate-50 shadow-sm w-44"
          >
            <Ionicons name="call" size={16} color="#00B6A6" />
            <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-700 text-xs font-bold ml-2">
              Phone
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <View className="absolute bottom-24 left-6 right-6 bg-slate-900/90 py-2.5 px-4 rounded-xl flex-row items-center justify-between z-50 shadow-md">
          <Text style={{ fontFamily: Theme.fonts.poppinsMedium }} className="text-white text-[11px] font-medium">
            {toastMessage}
          </Text>
          <Feather name="check-circle" size={14} color="#10B981" />
        </View>
      )}

      {/* STICKY BOTTOM ACTION BAR */}
      <View style={styles.bottomStickyBar} className="absolute bottom-0 left-0 right-0 py-4 px-5 z-40 bg-[#00B6A6] items-center justify-center">
        <TouchableOpacity 
          onPress={handlePayPress}
          className="w-full items-center justify-center active:scale-[0.98]"
        >
          <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-white text-base font-bold tracking-wide">
            Pay Now
          </Text>
        </TouchableOpacity>
      </View>

      {/* SIMULATED RAZORPAY / PAYMENT GATEWAY OVERLAY MODAL */}
      <Modal
        visible={paySheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaySheetVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end z-50">
          <TouchableOpacity 
            style={{ flex: 1 }} 
            onPress={() => !isProcessingPayment && setPaySheetVisible(false)} 
          />
          
          <View className="bg-white rounded-t-3xl p-6 min-h-[350px] shadow-2xl relative">
            {/* Header */}
            <View className="flex-row justify-between items-center pb-4 border-b border-slate-100">
              <View>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-base font-bold">
                  Oda Class Secure Payment
                </Text>
                <Text className="text-slate-450 text-[10px] mt-0.5">Powered by Razorpay / Gateway</Text>
              </View>
              <View className="items-end">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-lg font-bold">
                  ₹{masterPrice.toLocaleString('en-IN')}.00
                </Text>
              </View>
            </View>

            {isProcessingPayment ? (
              <View className="flex-1 items-center justify-center py-12">
                <ActivityIndicator size="large" color="#00B6A6" />
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-650 text-sm font-bold mt-4 text-center">
                  Processing payment security block...
                </Text>
                <Text className="text-slate-400 text-xs mt-1 text-center">Do not close the screen</Text>
              </View>
            ) : paymentFinished ? (
              <View className="flex-1 items-center justify-center py-12">
                <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mb-4">
                  <Feather name="check" size={32} color="#10B981" />
                </View>
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-base font-bold text-center">
                  Payment Successful!
                </Text>
                <Text className="text-slate-400 text-xs mt-1 text-center">Your seat has been reserved.</Text>
              </View>
            ) : (
              <View className="py-4">
                <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-500 text-xs uppercase tracking-wider mb-3">
                  Select payment mode
                </Text>

                {/* Options */}
                <View className="space-y-3">
                  {/* Google Pay */}
                  <TouchableOpacity 
                    onPress={() => triggerPaymentProcess('GPay')}
                    className="border border-slate-100 rounded-xl p-3 flex-row items-center justify-between active:bg-slate-50"
                  >
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="google-play" size={20} color="#3B82F6" className="mr-3" />
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-xs font-bold">GPay / Google Pay</Text>
                    </View>
                    <Feather name="chevron-right" size={14} color="#CBD5E1" />
                  </TouchableOpacity>

                  {/* PhonePe */}
                  <TouchableOpacity 
                    onPress={() => triggerPaymentProcess('PhonePe')}
                    className="border border-slate-100 rounded-xl p-3 flex-row items-center justify-between active:bg-slate-50"
                  >
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="wallet-outline" size={20} color="#7C3AED" className="mr-3" />
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-xs font-bold">PhonePe</Text>
                    </View>
                    <Feather name="chevron-right" size={14} color="#CBD5E1" />
                  </TouchableOpacity>

                  {/* Cards */}
                  <TouchableOpacity 
                    onPress={() => triggerPaymentProcess('Card')}
                    className="border border-slate-100 rounded-xl p-3 flex-row items-center justify-between active:bg-slate-50"
                  >
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="credit-card-outline" size={20} color="#EF4444" className="mr-3" />
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-xs font-bold">Credit / Debit Card</Text>
                    </View>
                    <Feather name="chevron-right" size={14} color="#CBD5E1" />
                  </TouchableOpacity>

                  {/* UPI */}
                  <TouchableOpacity 
                    onPress={() => triggerPaymentProcess('UPI')}
                    className="border border-slate-100 rounded-xl p-3 flex-row items-center justify-between active:bg-slate-50"
                  >
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="qrcode-scan" size={20} color="#059669" className="mr-3" />
                      <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-800 text-xs font-bold">Other UPI ID or QR Scan</Text>
                    </View>
                    <Feather name="chevron-right" size={14} color="#CBD5E1" />
                  </TouchableOpacity>
                </View>

                {/* Cancel button */}
                <TouchableOpacity 
                  onPress={() => setPaySheetVisible(false)}
                  className="bg-slate-100 py-3 rounded-full mt-6 items-center"
                >
                  <Text style={{ fontFamily: Theme.fonts.poppinsBold }} className="text-slate-600 text-xs font-bold">Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  grabbingBanner: {
    height: 94,
  },
  bottomStickyBar: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 10,
  }
});
