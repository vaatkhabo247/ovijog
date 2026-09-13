import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Detail = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in_progress' | 'resolved';
  location_text: string | null;
  photo_url: string | null;
  created_at: string;
  user_id: string;
  profiles: { full_name: string } | null;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#fef3c7', text: '#b45309', label: 'Pending' },
  in_progress: { bg: '#dbeafe', text: '#1d4ed8', label: 'In Progress' },
  resolved: { bg: '#d1fae5', text: '#047857', label: 'Resolved' },
};

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();

  const [complaint, setComplaint] = useState<Detail | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase
      .from('complaints')
      .select('id, title, description, category, status, location_text, photo_url, created_at, user_id, profiles(full_name)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setComplaint(data as any);
        setLoading(false);
      });

    if (session?.user) {
      supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => setIsAdmin(data?.role === 'admin'));
    }
  }, [id, session]);

  const canDelete = complaint && session?.user && (complaint.user_id === session.user.id || isAdmin);

  const handleDelete = () => {
    Alert.alert('Delete Complaint', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          const { error } = await supabase.from('complaints').delete().eq('id', id);
          setDeleting(false);

          if (error) {
            Alert.alert('Delete Failed', error.message);
            return;
          }

          router.back();
        },
      },
    ]);
  };

  if (loading || !complaint) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  const statusStyle = STATUS_STYLES[complaint.status] ?? STATUS_STYLES.pending;

  return (
    <ScrollView style={styles.container}>
      {complaint.photo_url ? (
        <Image source={{ uri: complaint.photo_url }} style={styles.photo} resizeMode="contain" />
      ) : null}

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{complaint.category}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
        </View>

        <Text style={styles.title}>{complaint.title}</Text>
        <Text style={styles.description}>{complaint.description}</Text>

        {complaint.location_text ? (
          <Text style={styles.meta}>📍 {complaint.location_text}</Text>
        ) : null}

        {complaint.profiles?.full_name ? (
          <Text style={styles.reporter}>Reported by {complaint.profiles.full_name}</Text>
        ) : null}

        <Text style={styles.date}>
          {new Date(complaint.created_at).toLocaleString()}
        </Text>

        {canDelete ? (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
            {deleting ? (
              <ActivityIndicator color="#dc2626" size="small" />
            ) : (
              <Text style={styles.deleteButtonText}>🗑️ Delete Complaint</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photo: { width: '100%', height: 240, backgroundColor: '#f3f4f6' },
  content: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryPill: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  categoryText: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 12 },
  description: { fontSize: 14, color: '#4b5563', marginTop: 8, lineHeight: 20 },
  meta: { fontSize: 13, color: '#6b7280', marginTop: 12 },
  reporter: { fontSize: 12, color: '#9ca3af', marginTop: 6 },
  date: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
  deleteButton: {
    marginTop: 24,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
});
