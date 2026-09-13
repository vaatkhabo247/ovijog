import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Profile = {
  full_name: string;
  email: string;
  role: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!session?.user) return;

      (async () => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email, role')
          .eq('id', session.user.id)
          .single();

        if (profileData) setProfile(profileData);

        const { data: complaintsData } = await supabase
          .from('complaints')
          .select('status')
          .eq('user_id', session.user.id);

        if (complaintsData) {
          setStats({
            total: complaintsData.length,
            pending: complaintsData.filter((c) => c.status === 'pending').length,
            resolved: complaintsData.filter((c) => c.status === 'resolved').length,
          });
        }

        setLoading(false);
      })();
    }, [session])
  );

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>My Profile</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1d4ed8" />
      ) : (
        <>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.name}>{profile?.full_name ?? 'Unknown'}</Text>
            <Text style={styles.email}>{profile?.email}</Text>
            {profile?.role === 'admin' ? (
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>Admin</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#b45309' }]}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#047857' }]}>{stats.resolved}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>

          {profile?.role === 'admin' ? (
            <TouchableOpacity style={styles.adminButton} onPress={() => router.push('/admin')}>
              <Text style={styles.adminButtonText}>🛡️ Admin Panel</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', paddingTop: 56 },
  header: { fontSize: 22, fontWeight: '800', color: '#111827', paddingHorizontal: 16, marginBottom: 16 },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '700', color: '#111827' },
  email: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  roleBadge: {
    marginTop: 8,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleBadgeText: { color: '#047857', fontSize: 12, fontWeight: '700' },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#e5e7eb' },
  statNumber: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  adminButton: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  adminButtonText: { color: '#1d4ed8', fontWeight: '700', fontSize: 14 },
  logoutButton: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
});
