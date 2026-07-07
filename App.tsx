import React from 'react';
import { View, ActivityIndicator, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeWindStyleSheet } from 'nativewind';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from './src/constants/theme';

NativeWindStyleSheet.setOutput({
  default: 'native',
});
import { 
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold 
} from '@expo-google-fonts/poppins';

// Context
import { AppProvider } from './src/context/AppContext';
import { useApp } from './src/context/AppContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { OtpScreen } from './src/screens/OtpScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { WhyOdaScreen } from './src/screens/WhyOdaScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { MasterProgramScreen } from './src/screens/MasterProgramScreen';
import { OrderLoadingScreen, OrderPaymentScreen } from './src/screens/CheckoutScreens';
import { BoosterDetailsScreen, BoosterSelectClassScreen } from './src/screens/BoosterScreens';
import { CourseDetailsScreen } from './src/screens/CourseDetailsScreen';
import { 
  TestIntroScreen, 
  TestQuizScreen, 
  TestReportScreen, 
  MaterialsModulesScreen, 
  MaterialsFilesScreen 
} from './src/screens/TestAndMaterialsScreens';
import { 
  ReportPeriodSelectScreen, 
  StudyReportScreen 
} from './src/screens/StudyReportScreens';
import { 
  ClassDetailsScreen, 
  HomeworkQuizScreen, 
  HomeworkReportScreen 
} from './src/screens/ClassDetailsScreen';
import {
  FaqScreen,
  MyOrdersScreen,
  AboutOdaClassScreen,
} from './src/screens/MeScreens';

const { width } = Dimensions.get('window');

const getFontSize = (baseSize: number) => {
  if (width > 400) return baseSize;
  return baseSize - 1.5;
};

const RootApp: React.FC = () => {
  const { currentScreen, navigateTo, activeTab, setActiveTab } = useApp();

  const showTabBar = [
    'DASHBOARD',
    'CLASS_DETAILS',
    'COURSE_DETAILS',
    'MATERIALS_MODULES',
    'WHY_ODA',
    'REPORT_PERIOD_SELECT'
  ].includes(currentScreen);

  // Render the current active screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'SPLASH':
        return <SplashScreen />;
      case 'LOGIN':
        return <LoginScreen />;
      case 'OTP':
        return <OtpScreen />;
      case 'DASHBOARD':
        return <DashboardScreen />;
      case 'WHY_ODA':
        return <WhyOdaScreen />;
      case 'PROFILE':
        return <ProfileScreen />;
      case 'MASTER_PROGRAM':
        return <MasterProgramScreen />;
      case 'ORDER_LOADING':
        return <OrderLoadingScreen />;
      case 'ORDER_PAYMENT':
        return <OrderPaymentScreen />;
      case 'BOOSTER_DETAILS':
        return <BoosterDetailsScreen />;
      case 'BOOSTER_SELECT_CLASS':
        return <BoosterSelectClassScreen />;
      case 'COURSE_DETAILS':
        return <CourseDetailsScreen />;
      case 'TEST_INTRO':
        return <TestIntroScreen />;
      case 'TEST_QUIZ':
        return <TestQuizScreen />;
      case 'TEST_REPORT':
        return <TestReportScreen />;
      case 'MATERIALS_MODULES':
        return <MaterialsModulesScreen />;
      case 'MATERIALS_FILES':
        return <MaterialsFilesScreen />;
      case 'REPORT_PERIOD_SELECT':
        return <ReportPeriodSelectScreen />;
      case 'STUDY_REPORT':
        return <StudyReportScreen />;
      case 'CLASS_DETAILS':
        return <ClassDetailsScreen />;
      case 'HOMEWORK_QUIZ':
        return <HomeworkQuizScreen />;
      case 'HOMEWORK_REPORT':
        return <HomeworkReportScreen />;
      case 'FAQ':
        return <FaqScreen />;
      case 'MY_ORDERS':
        return <MyOrdersScreen />;
      case 'ABOUT_ODA':
        return <AboutOdaClassScreen />;
      default:
        return <SplashScreen />;
    }
  };

  return (
    <View className="flex-1 bg-[#F4FBF9]">
      <StatusBar style="dark" />
      
      {/* Screen Render */}
      <View className="flex-1">
        {renderScreen()}
      </View>

      {/* Global Bottom Tab Bar */}
      {showTabBar && (
        <View style={styles.tabBar} className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex-row items-center justify-around py-2 px-3 z-45">
          {[
            { key: 'Home', icon: 'eye-circle-outline', activeIcon: 'eye-circle', label: 'Home' },
            { key: 'My Study', icon: 'book-open-variant', activeIcon: 'book-open-page-variant', label: 'My Study' },
            { key: 'Genie', icon: 'star-shooting-outline', activeIcon: 'star-shooting', label: 'Genie' },
            { key: 'Me', icon: 'account-outline', activeIcon: 'account', label: 'Me' }
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            const tintColor = isActive ? '#00B6A6' : '#94A3B8';
            const iconName = isActive ? tab.activeIcon : tab.icon;
            
            return (
              <TouchableOpacity 
                key={tab.key}
                onPress={() => {
                  setActiveTab(tab.key as any);
                  navigateTo('DASHBOARD');
                }}
                className="items-center justify-center py-1 flex-1 active:opacity-75"
              >
                <MaterialCommunityIcons name={iconName as any} size={23} color={tintColor} />
                <Text 
                  style={{ 
                    fontFamily: isActive ? Theme.fonts.poppinsBold : Theme.fonts.poppinsRegular,
                    color: tintColor,
                    fontSize: getFontSize(9.5)
                  }}
                  className="mt-1 font-medium text-center"
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 65,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 10,
  },
});

export default function App() {
  // Load Poppins Google Fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    // Show simple loader in place of splash until fonts load
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#00B6A6" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}

