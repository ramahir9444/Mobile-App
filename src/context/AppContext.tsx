import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppAnalyticsProvider } from './AppAnalyticsContext';

export type AppScreen =
  | 'SPLASH'
  | 'LOGIN'
  | 'OTP'
  | 'DASHBOARD'
  | 'WHY_ODA'
  | 'PROFILE'
  | 'MASTER_PROGRAM'
  | 'ORDER_LOADING'
  | 'ORDER_PAYMENT'
  | 'BOOSTER_DETAILS'
  | 'BOOSTER_SELECT_CLASS'
  | 'COURSE_DETAILS'
  | 'TEST_INTRO'
  | 'TEST_QUIZ'
  | 'TEST_REPORT'
  | 'MATERIALS_MODULES'
  | 'MATERIALS_FILES'
  | 'REPORT_PERIOD_SELECT'
  | 'STUDY_REPORT'
  | 'CLASS_DETAILS'
  | 'HOMEWORK_QUIZ'
  | 'HOMEWORK_REPORT';

export interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  coins: number;
  xp: number;
  level: number;
  streak: number;
  attendance: number;
  avatar: string;
  altPhone?: string;
  board?: string;
  state?: string;
  address?: string;
}

export interface BookingDetails {
  teacherName: string;
  teacherAvatar: string;
  subject: string;
  grade: string;
  date: string;
  time: string;
  duration: string;
  parentName: string;
  studentName: string;
  phone: string;
  email: string;
  state: string;
  language: string;
}

interface AppContextType {
  // Navigation State
  currentScreen: AppScreen;
  screenStack: AppScreen[];
  navigateTo: (screen: AppScreen) => void;
  goBack: () => void;
  goBackTo: (screen: AppScreen) => void;
  
  // Auth Form Data (shared across auth screens)
  authPhone: string;
  setAuthPhone: (phone: string) => void;

  // Simulator Control States
  isOffline: boolean;
  isLoading: boolean;
  hasErrors: boolean;
  toggleOffline: () => void;
  toggleLoading: () => void;
  toggleErrors: () => void;

  // User Profile State
  user: UserProfile;
  updateUser: (fields: Partial<UserProfile>) => void;
  resetUser: () => void;

  // Temporary App Form Data (shared across auth screens)
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authName: string;
  setAuthName: (name: string) => void;

  // Phase 2 Learning states
  selectedSubject: string;
  setSelectedSubject: (subject: string) => void;
  selectedChapter: string;
  setSelectedChapter: (chapter: string) => void;
  selectedLesson: string;
  setSelectedLesson: (lesson: string) => void;

  // Selected Class (global state for Dashboard & Profile synchronization)
  selectedClass: string;
  setSelectedClass: (cls: string) => void;

  // Enrollment state tracker
  isEnrolled: boolean;
  setIsEnrolled: (enrolled: boolean) => void;

  // Selected report period
  selectedReportPeriod: string;
  setSelectedReportPeriod: (period: string) => void;

  // Live classroom interaction simulation triggers
  simulatedQuizActive: boolean;
  triggerQuiz: (active: boolean) => void;
  simulatedPollActive: boolean;
  triggerPoll: (active: boolean) => void;
  simulatedStageInvite: 'voice' | 'camera_mic' | null;
  triggerStageInvite: (invite: 'voice' | 'camera_mic' | null) => void;
  simulatedDisconnect: boolean;
  triggerDisconnect: (active: boolean) => void;

  // Booking Details (Module 1)
  bookingDetails: BookingDetails;
  updateBookingDetails: (fields: Partial<BookingDetails>) => void;

  // Popup session tracker
  hasSeenPopup: boolean;
  setHasSeenPopup: (seen: boolean) => void;

  // Active Tab state for global navigation tab bar
  activeTab: 'Home' | 'My Study' | 'Genie' | 'Me';
  setActiveTab: (tab: 'Home' | 'My Study' | 'Genie' | 'Me') => void;
}

const defaultUser: UserProfile = {
  name: 'Ram',
  email: '',
  phone: '',
  coins: 240,
  xp: 450,
  level: 12,
  streak: 7,
  attendance: 92,
  avatar: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('SPLASH');
  const [screenStack, setScreenStack] = useState<AppScreen[]>(['SPLASH']);
  
  // Simulator triggers
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);

  // Live classroom interaction simulation triggers
  const [simulatedQuizActive, setSimulatedQuizActive] = useState(false);
  const [simulatedPollActive, setSimulatedPollActive] = useState(false);
  const [simulatedStageInvite, setSimulatedStageInvite] = useState<'voice' | 'camera_mic' | null>(null);
  const [simulatedDisconnect, setSimulatedDisconnect] = useState(false);

  const triggerQuiz = (active: boolean) => setSimulatedQuizActive(active);
  const triggerPoll = (active: boolean) => setSimulatedPollActive(active);
  const triggerStageInvite = (invite: 'voice' | 'camera_mic' | null) => setSimulatedStageInvite(invite);
  const triggerDisconnect = (active: boolean) => setSimulatedDisconnect(active);

  // User profile
  const [user, setUser] = useState<UserProfile>(defaultUser);

  // Shared form inputs for auth demonstration flow
  const [authEmail, setAuthEmail] = useState('student@example.com');
  const [authName, setAuthName] = useState('Priya Sharma');
  const [authPhone, setAuthPhone] = useState('');

  // Phase 2 Learning states
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedChapter, setSelectedChapter] = useState('Chapter 3: Quadratic Equations');
  const [selectedLesson, setSelectedLesson] = useState('Factoring Quadratic Polynomials');

  const [selectedClass, setSelectedClass] = useState('Class 1');

  // Popup session tracker state
  const [hasSeenPopup, setHasSeenPopup] = useState<boolean>(false);

  // Enrollment state tracker
  const [isEnrolled, setIsEnrolled] = useState<boolean>(true);

  // Selected report period
  const [selectedReportPeriod, setSelectedReportPeriod] = useState<string>('Weekly');

  // Active Tab state for global navigation tab bar
  const [activeTab, setActiveTab] = useState<'Home' | 'My Study' | 'Genie' | 'Me'>('Home');

  // Booking Details (Module 1)
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    teacherName: 'Ninja Mam (Priyanka)',
    teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    subject: 'Maths',
    grade: 'Grade 6',
    date: '6 Jul',
    time: '8:10 pm - 9:10 pm',
    duration: '60 minutes',
    parentName: '',
    studentName: '',
    phone: '',
    email: '',
    state: '',
    language: 'English',
  });

  const updateBookingDetails = (fields: Partial<BookingDetails>) => {
    setBookingDetails((prev) => ({ ...prev, ...fields }));
  };

  // Trigger splash skeleton loader effect on screen change if global loading is toggled
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const navigateTo = (screen: AppScreen) => {
    // If loading, trigger a short mock loading state for responsiveness
    setScreenStack((prev) => [...prev, screen]);
    setCurrentScreen(screen);
  };

  const goBack = () => {
    if (screenStack.length > 1) {
      const newStack = [...screenStack];
      newStack.pop();
      setScreenStack(newStack);
      setCurrentScreen(newStack[newStack.length - 1]);
    }
  };

  const goBackTo = (screen: AppScreen) => {
    const idx = screenStack.indexOf(screen);
    if (idx !== -1) {
      const newStack = screenStack.slice(0, idx + 1);
      setScreenStack(newStack);
      setCurrentScreen(screen);
    } else {
      setScreenStack([screen]);
      setCurrentScreen(screen);
    }
  };

  const toggleOffline = () => {
    setIsOffline((prev) => !prev);
  };

  const toggleLoading = () => {
    setIsLoading((prev) => !prev);
  };

  const toggleErrors = () => {
    setHasErrors((prev) => !prev);
  };

  const updateUser = (fields: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...fields }));
  };

  const resetUser = () => {
    setUser(defaultUser);
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        screenStack,
        navigateTo,
        goBack,
        goBackTo,
        authPhone,
        setAuthPhone,
        isOffline,
        isLoading,
        hasErrors,
        toggleOffline,
        toggleLoading,
        toggleErrors,
        user,
        updateUser,
        resetUser,
        authEmail,
        setAuthEmail,
        authName,
        setAuthName,
        selectedSubject,
        setSelectedSubject,
        selectedChapter,
        setSelectedChapter,
        selectedLesson,
        setSelectedLesson,
        selectedClass,
        setSelectedClass,
        simulatedQuizActive,
        triggerQuiz,
        simulatedPollActive,
        triggerPoll,
        simulatedStageInvite,
        triggerStageInvite,
        simulatedDisconnect,
        triggerDisconnect,
        bookingDetails,
        updateBookingDetails,
        hasSeenPopup,
        setHasSeenPopup,
        isEnrolled,
        setIsEnrolled,
        selectedReportPeriod,
        setSelectedReportPeriod,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
