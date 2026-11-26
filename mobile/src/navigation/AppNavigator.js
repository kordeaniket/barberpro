import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTranslation } from '../i18n';
import { COLORS } from '../theme';

import LoginScreen from '../screens/auth/LoginScreen';

// Barber Screens
import BarberDashboardScreen from '../screens/barber/BarberDashboardScreen';
import BarberAppointmentsScreen from '../screens/barber/BarberAppointmentsScreen';
import BarberClientsScreen from '../screens/barber/BarberClientsScreen';
import BarberServicesScreen from '../screens/barber/BarberServicesScreen';
import BarberBillingScreen from '../screens/barber/BarberBillingScreen';
import BarberProfileScreen from '../screens/barber/BarberProfileScreen';

// Customer Screens
import CustomerHomeScreen from '../screens/customer/CustomerHomeScreen';
import CustomerBookScreen from '../screens/customer/CustomerBookScreen';
import CustomerBookingsScreen from '../screens/customer/CustomerBookingsScreen';
import CustomerProfileScreen from '../screens/customer/CustomerProfileScreen';

// Super Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminShopsScreen from '../screens/admin/AdminShopsScreen';
import AdminRequestsScreen from '../screens/admin/AdminRequestsScreen';
import AdminPlansScreen from '../screens/admin/AdminPlansScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';

const Tab = createBottomTabNavigator();

const tabScreenOptions = (icons) => ({ route }) => ({
  headerShown: false,
  tabBarActiveTintColor: COLORS.amberDark,
  tabBarInactiveTintColor: COLORS.textMuted,
  tabBarStyle: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    height: 62,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
  tabBarItemStyle: { paddingHorizontal: 0 },
  tabBarIcon: ({ focused, color, size }) => {
    const pair = icons[route.name] || ['ellipse', 'ellipse-outline'];
    return <Ionicons name={focused ? pair[0] : pair[1]} size={size} color={color} />;
  },
});

function BarberTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={tabScreenOptions({
        Dashboard: ['grid', 'grid-outline'],
        Appointments: ['calendar', 'calendar-outline'],
        Clients: ['people', 'people-outline'],
        Services: ['cut', 'cut-outline'],
        Billing: ['receipt', 'receipt-outline'],
        Profile: ['storefront', 'storefront-outline'],
      })}
    >
      <Tab.Screen name="Dashboard" component={BarberDashboardScreen} options={{ title: t('nav.dashboard') }} />
      <Tab.Screen name="Appointments" component={BarberAppointmentsScreen} options={{ title: t('nav.appointments') }} />
      <Tab.Screen name="Clients" component={BarberClientsScreen} options={{ title: t('nav.clients') }} />
      <Tab.Screen name="Services" component={BarberServicesScreen} options={{ title: t('barber.servicesTab') }} />
      <Tab.Screen name="Billing" component={BarberBillingScreen} options={{ title: t('nav.billing') }} />
      <Tab.Screen name="Profile" component={BarberProfileScreen} options={{ title: t('nav.profile') }} />
    </Tab.Navigator>
  );
}

function CustomerTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={tabScreenOptions({
        Home: ['home', 'home-outline'],
        Book: ['add-circle', 'add-circle-outline'],
        History: ['time', 'time-outline'],
        MyProfile: ['person', 'person-outline'],
      })}
    >
      <Tab.Screen name="Home" component={CustomerHomeScreen} options={{ title: t('nav.home') }} />
      <Tab.Screen name="Book" component={CustomerBookScreen} options={{ title: t('nav.book') }} />
      <Tab.Screen name="History" component={CustomerBookingsScreen} options={{ title: t('nav.history') }} />
      <Tab.Screen name="MyProfile" component={CustomerProfileScreen} options={{ title: t('nav.myProfile') }} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={tabScreenOptions({
        Overview: ['stats-chart', 'stats-chart-outline'],
        Shops: ['storefront', 'storefront-outline'],
        Requests: ['document-text', 'document-text-outline'],
        Plans: ['pricetags', 'pricetags-outline'],
        Settings: ['settings', 'settings-outline'],
      })}
    >
      <Tab.Screen name="Overview" component={AdminDashboardScreen} options={{ title: t('nav.overview') }} />
      <Tab.Screen name="Shops" component={AdminShopsScreen} options={{ title: t('nav.shops') }} />
      <Tab.Screen name="Requests" component={AdminRequestsScreen} options={{ title: t('nav.requests') }} />
      <Tab.Screen name="Plans" component={AdminPlansScreen} options={{ title: t('nav.plans') }} />
      <Tab.Screen name="Settings" component={AdminSettingsScreen} options={{ title: t('nav.settings') }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const user = useSelector((s) => s.auth.user);

  return (
    <NavigationContainer>
      {!user ? (
        <LoginScreen />
      ) : user.role === 'barber' ? (
        <BarberTabs />
      ) : user.role === 'superadmin' ? (
        <AdminTabs />
      ) : (
        <CustomerTabs />
      )}
    </NavigationContainer>
  );
}
