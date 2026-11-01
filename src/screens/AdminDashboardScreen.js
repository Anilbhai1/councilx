/**
 * COUNCIL X | THE SYNDICATE
 * Stealth God Mode Admin Dashboard Wrapper
 * 
 * Re-exports the newly designed Pure Pitch Black, Minimalist,
 * Terminal-Style God Mode Dashboard with Supabase Data Fetching
 * and User Subscription Override Switch.
 */

import React from 'react';
import GodModeDashboardScreen from './GodModeDashboardScreen';

export default function AdminDashboardScreen(props) {
  return <GodModeDashboardScreen {...props} />;
}
