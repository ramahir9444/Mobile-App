import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');
const getFontSize = (size: number) => (width > 400 ? size : size - 1.2);

// ─────────────────────────────────────────────
// SHARED HEADER
// ─────────────────────────────────────────────
const ScreenHeader: React.FC<{ title: string; rightIcon?: React.ReactNode }> = ({ title, rightIcon }) => {
  const { goBack } = useApp();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Feather name="chevron-left" size={26} color="#1E293B" />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { fontFamily: Theme.fonts.poppinsBold }]}>{title}</Text>
      <View style={styles.headerRight}>{rightIcon ?? null}</View>
    </View>
  );
};

// ─────────────────────────────────────────────
// 1. FAQs SCREEN
// ─────────────────────────────────────────────
const faqData = [
  {
    q: 'How to enroll in courses?',
    a: 'Select the courses you need and click to see course details, click "Enroll Now" to confirm.',
  },
  {
    q: 'How to use coupons?',
    a: 'Go to My Orders, apply your coupon code at checkout. The discount will be applied automatically.',
  },
  {
    q: 'How to check the courses I enrolled in?',
    a: 'Tap "My Study" tab at the bottom of the app. All enrolled courses appear there.',
  },
  {
    q: 'How to attend a course?',
    a: 'Go to "My Study", find your enrolled course and tap "Join Class" when the class is live.',
  },
  {
    q: 'How to turn on/off the course voice reminder?',
    a: 'Go to Me → Profile and toggle the "Course Voice Reminder" switch.',
  },
  {
    q: 'How to watch session replay?',
    a: 'After a class ends, the replay appears under "My Study" → the course → past classes section.',
  },
  {
    q: 'What are Oda Coins for?',
    a: 'Oda Coins are reward points earned by attending classes. Use them for discounts at Oda Mall.',
  },
  {
    q: 'How to withdraw from courses?',
    a: 'Contact our support team at support@pigeonedu.com to request a withdrawal.',
  },
];

export const FaqScreen: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => setOpenIdx(prev => (prev === idx ? null : idx));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScreenHeader
        title="FAQs"
        rightIcon={<Feather name="edit-2" size={18} color="#94A3B8" />}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100 }}
      >
        {/* FAQ Cards */}
        <View style={styles.faqCard}>
          {faqData.map((item, idx) => {
            const isOpen = openIdx === idx;
            const isLast = idx === faqData.length - 1;
            return (
              <View key={idx}>
                <TouchableOpacity
                  onPress={() => toggle(idx)}
                  activeOpacity={0.75}
                  style={[styles.faqRow, isLast && !isOpen && { borderBottomWidth: 0 }]}
                >
                  {/* Number */}
                  <Text style={[styles.faqNumber, { fontFamily: Theme.fonts.poppinsRegular }]}>
                    {idx + 1}
                  </Text>
                  {/* Question */}
                  <Text
                    style={[
                      styles.faqQuestion,
                      { fontFamily: isOpen ? Theme.fonts.poppinsBold : Theme.fonts.poppinsMedium },
                    ]}
                  >
                    {item.q}
                  </Text>
                  {/* Chevron */}
                  <Feather
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#94A3B8"
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>

                {/* Answer */}
                {isOpen && (
                  <View style={styles.faqAnswer}>
                    <Text style={[styles.faqAnswerText, { fontFamily: Theme.fonts.poppinsRegular }]}>
                      {item.a}
                    </Text>
                  </View>
                )}

                {/* Divider (not after last) */}
                {!isLast && <View style={styles.faqDivider} />}
              </View>
            );
          })}
        </View>

        {/* Other Questions link */}
        <TouchableOpacity
          onPress={() => Linking.openURL('mailto:support@pigeonedu.com')}
          style={styles.otherQLink}
        >
          <Text style={[styles.otherQText, { fontFamily: Theme.fonts.poppinsMedium }]}>
            Other Questions? {'>>'} 
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// 2. MY ORDERS SCREEN
// ─────────────────────────────────────────────
const pendingOrders = [
  {
    id: 1,
    title: 'Concept Booster Course – 5X Efficient Learning Methods by IITians',
    classInfo: 'Class 6 | 6 Jul – 11 Jul',
    coupon: '₹ 20',
    total: '₹ 9',
    status: 'pending',
  },
];

const pastOrders = [
  {
    id: 2,
    title: 'Welcome Assessment Test – Class 6',
    classInfo: 'Class 6 | 1 Jul',
    coupon: null,
    total: '₹ 0',
    status: 'paid',
  },
];

export const MyOrdersScreen: React.FC = () => {
  const { navigateTo } = useApp();
  const [showOther, setShowOther] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScreenHeader title="My Orders" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100 }}
      >
        {/* Pending / Active Orders */}
        {pendingOrders.map(order => (
          <View key={order.id} style={styles.orderCard}>
            {/* Title & class info */}
            <Text style={[styles.orderTitle, { fontFamily: Theme.fonts.poppinsMedium }]}>
              {order.title}
            </Text>
            <Text style={[styles.orderMeta, { fontFamily: Theme.fonts.poppinsRegular }]}>
              {order.classInfo}
            </Text>

            {/* Coupon row */}
            {order.coupon && (
              <View style={styles.couponRow}>
                <Text style={[styles.couponLabel, { fontFamily: Theme.fonts.poppinsMedium }]}>
                  Eligible Coupon
                </Text>
                <Text style={[styles.couponAmount, { fontFamily: Theme.fonts.poppinsMedium }]}>
                  {order.coupon}
                </Text>
              </View>
            )}

            {/* Divider */}
            <View style={styles.orderDivider} />

            {/* Total + Pay Now */}
            <View style={styles.orderFooter}>
              <Text style={[styles.totalLabel, { fontFamily: Theme.fonts.poppinsMedium }]}>
                Total:{' '}
                <Text style={[styles.totalAmount, { fontFamily: Theme.fonts.poppinsBold }]}>
                  {order.total}
                </Text>
              </Text>
              <TouchableOpacity
                onPress={() => navigateTo('BOOSTER_DETAILS')}
                style={styles.payNowBtn}
                activeOpacity={0.85}
              >
                <Text style={[styles.payNowText, { fontFamily: Theme.fonts.poppinsBold }]}>
                  Pay Now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Other Orders toggle */}
        <TouchableOpacity
          onPress={() => setShowOther(prev => !prev)}
          style={styles.otherOrdersToggle}
        >
          <Feather
            name={showOther ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#64748B"
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.otherOrdersText, { fontFamily: Theme.fonts.poppinsMedium }]}>
            Other Orders
          </Text>
        </TouchableOpacity>

        {showOther && (
          <View style={{ marginTop: 8 }}>
            {pastOrders.map(order => (
              <View key={order.id} style={[styles.orderCard, { opacity: 0.8 }]}>
                <Text style={[styles.orderTitle, { fontFamily: Theme.fonts.poppinsMedium }]}>
                  {order.title}
                </Text>
                <Text style={[styles.orderMeta, { fontFamily: Theme.fonts.poppinsRegular }]}>
                  {order.classInfo}
                </Text>
                <View style={styles.orderDivider} />
                <View style={styles.orderFooter}>
                  <Text style={[styles.totalLabel, { fontFamily: Theme.fonts.poppinsMedium }]}>
                    Total:{' '}
                    <Text style={[styles.totalAmount, { fontFamily: Theme.fonts.poppinsBold }]}>
                      {order.total}
                    </Text>
                  </Text>
                  <View style={styles.paidBadge}>
                    <Text style={[styles.paidText, { fontFamily: Theme.fonts.poppinsBold }]}>
                      Paid ✓
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// 3. ABOUT ODA CLASS SCREEN
// ─────────────────────────────────────────────
const purchaseSteps = [
  'Select a Course on Oda app homepage.',
  'Enroll the course.',
  "Find the course you have bought at 'My Study' tab.",
  'You can enter LIVE Classroom 10 mins before it starts.',
];

export const AboutOdaClassScreen: React.FC = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScreenHeader title="Oda Class – Best LIVE Learning App" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HERO BANNER */}
        <View style={styles.heroBanner}>
          <View style={{ flex: 1 }}>
            {/* oda class logo text */}
            <View style={styles.odaLogoRow}>
              <Text style={[styles.odaLogoText, { fontFamily: Theme.fonts.poppinsBold }]}>
                oda
              </Text>
              <View style={styles.odaOrangeDot} />
              <Text style={[styles.odaLogoText, { fontFamily: Theme.fonts.poppinsBold, color: '#1E293B' }]}>
                {' '}class
              </Text>
            </View>
            <Text style={[styles.heroTagline, { fontFamily: Theme.fonts.poppinsRegular }]}>
              Better Teacher, Better Future
            </Text>
            <Text style={[styles.heroTagline, { fontFamily: Theme.fonts.poppinsRegular }]}>
              Dual-teacher LIVE Class
            </Text>
          </View>

          {/* Tablet illustration placeholder */}
          <View style={styles.tabletIllustration}>
            <MaterialCommunityIcons name="tablet" size={52} color="#00B6A6" />
            <View style={styles.tabletIconRow}>
              <MaterialCommunityIcons name="book-open-variant" size={14} color="#F97316" />
              <MaterialCommunityIcons name="flask" size={14} color="#8B5CF6" style={{ marginLeft: 4 }} />
              <MaterialCommunityIcons name="calculator" size={14} color="#0EA5E9" style={{ marginLeft: 4 }} />
            </View>
          </View>
        </View>

        {/* VERSION */}
        <View style={styles.aboutSection}>
          <Text style={[styles.aboutSectionTitle, { fontFamily: Theme.fonts.poppinsBold }]}>
            Version
          </Text>
          <Text style={[styles.aboutBodyText, { fontFamily: Theme.fonts.poppinsRegular }]}>
            10.1.0
          </Text>
        </View>

        <View style={styles.divider} />

        {/* CONTACT US */}
        <View style={styles.aboutSection}>
          <Text style={[styles.aboutSectionTitle, { fontFamily: Theme.fonts.poppinsBold }]}>
            Contact Us
          </Text>

          {/* Email */}
          <View style={styles.contactRow}>
            <Text style={[styles.contactDot, { fontFamily: Theme.fonts.poppinsRegular }]}>•</Text>
            <Text style={[styles.aboutBodyText, { fontFamily: Theme.fonts.poppinsRegular }]}>
              {'Email: '}
              <Text
                style={styles.linkText}
                onPress={() => Linking.openURL('mailto:support@pigeonedu.com')}
              >
                support@pigeonedu.com
              </Text>
            </Text>
          </View>

          {/* Address */}
          <View style={styles.contactRow}>
            <Text style={[styles.contactDot, { fontFamily: Theme.fonts.poppinsRegular }]}>•</Text>
            <Text style={[styles.aboutBodyText, { fontFamily: Theme.fonts.poppinsRegular }]}>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium }}>Address: </Text>
              IndiQube Fore, Carmelaram Rd, Carmelaram, Ambedkar Nagar, Chikkabellandur, Bengaluru, Karnataka 560035
            </Text>
          </View>

          {/* Company */}
          <View style={styles.contactRow}>
            <Text style={[styles.contactDot, { fontFamily: Theme.fonts.poppinsRegular }]}>•</Text>
            <Text style={[styles.aboutBodyText, { fontFamily: Theme.fonts.poppinsRegular }]}>
              <Text style={{ fontFamily: Theme.fonts.poppinsMedium }}>Company Name: </Text>
              Pigeon Education Technology
            </Text>
          </View>

          {/* Links */}
          <TouchableOpacity
            onPress={() => Linking.openURL('https://pigeonedu.com/privacy')}
            style={styles.policyLinkRow}
          >
            <Text style={[styles.contactDot, { fontFamily: Theme.fonts.poppinsRegular }]}>•</Text>
            <Text style={[styles.linkText, { fontFamily: Theme.fonts.poppinsMedium }]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://pigeonedu.com/terms')}
            style={styles.policyLinkRow}
          >
            <Text style={[styles.contactDot, { fontFamily: Theme.fonts.poppinsRegular }]}>•</Text>
            <Text style={[styles.linkText, { fontFamily: Theme.fonts.poppinsMedium }]}>
              Terms of Service
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* PROCESS */}
        <View style={styles.aboutSection}>
          <Text style={[styles.aboutSectionTitle, { fontFamily: Theme.fonts.poppinsBold }]}>
            Process of purchasing products and services
          </Text>

          {purchaseSteps.map((step, idx) => (
            <View key={idx} style={styles.stepRow}>
              <Text style={[styles.stepNumber, { fontFamily: Theme.fonts.poppinsMedium }]}>
                {idx + 1}.
              </Text>
              <Text style={[styles.stepText, { fontFamily: Theme.fonts.poppinsRegular }]}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  // Shared header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: getFontSize(16),
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  headerRight: {
    width: 38,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // FAQs
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  faqNumber: {
    fontSize: getFontSize(13.5),
    color: '#94A3B8',
    marginRight: 10,
    marginTop: 2,
    width: 16,
  },
  faqQuestion: {
    fontSize: getFontSize(14.5),
    color: '#1E293B',
    flex: 1,
    lineHeight: 21,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 16,
  },
  faqAnswerText: {
    fontSize: getFontSize(13.5),
    color: '#64748B',
    lineHeight: 20,
    marginLeft: 26,
  },
  faqDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  otherQLink: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  otherQText: {
    fontSize: getFontSize(14),
    color: '#00B6A6',
  },

  // My Orders
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderTitle: {
    fontSize: getFontSize(14.5),
    color: '#1E293B',
    lineHeight: 21,
    marginBottom: 4,
  },
  orderMeta: {
    fontSize: getFontSize(12.5),
    color: '#94A3B8',
    marginBottom: 10,
  },
  couponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  couponLabel: {
    fontSize: getFontSize(13),
    color: '#D97706',
  },
  couponAmount: {
    fontSize: getFontSize(13),
    color: '#D97706',
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: getFontSize(14),
    color: '#1E293B',
  },
  totalAmount: {
    fontSize: getFontSize(16),
    color: '#00B6A6',
  },
  payNowBtn: {
    backgroundColor: '#00B6A6',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 9,
  },
  payNowText: {
    color: '#FFFFFF',
    fontSize: getFontSize(14),
  },
  paidBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  paidText: {
    color: '#10B981',
    fontSize: getFontSize(13),
  },
  otherOrdersToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  otherOrdersText: {
    fontSize: getFontSize(14),
    color: '#64748B',
  },

  // About Oda Class
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF9F8',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
  },
  odaLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  odaLogoText: {
    fontSize: getFontSize(24),
    color: '#00B6A6',
    letterSpacing: -0.5,
  },
  odaOrangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F97316',
    marginBottom: 14,
  },
  heroTagline: {
    fontSize: getFontSize(12.5),
    color: '#334155',
    lineHeight: 19,
  },
  tabletIllustration: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabletIconRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  aboutSection: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  aboutSectionTitle: {
    fontSize: getFontSize(16),
    color: '#0F172A',
    marginBottom: 12,
  },
  aboutBodyText: {
    fontSize: getFontSize(14),
    color: '#334155',
    lineHeight: 21,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  contactDot: {
    fontSize: getFontSize(14),
    color: '#334155',
    marginRight: 8,
    marginTop: 1,
  },
  linkText: {
    fontSize: getFontSize(14),
    color: '#00B6A6',
    lineHeight: 21,
  },
  policyLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNumber: {
    fontSize: getFontSize(14),
    color: '#334155',
    marginRight: 8,
    marginTop: 1,
    minWidth: 20,
  },
  stepText: {
    fontSize: getFontSize(14),
    color: '#334155',
    lineHeight: 21,
    flex: 1,
  },
});
