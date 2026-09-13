import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type AdminComplaint = {
  id: string;
  title: string;
  category: string;
  status: 'pending' | 'in_progress' | 'resolved';
  location_text: string | null;
};

const STATUS_OPTIONS: Array<'pending' | 'in_progress' | 'resolved'> = [
  'pending',
  'in_progress',
  'resolved',
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

export default function AdminPanelScreen() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.role === 'admin');
      });
  }, [session]);

  const fetchComplaints = useCallback(async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select('id, title, category, status, location_text')
      .order('created_at', { ascending: false });
    if (!error && data) setComplaints(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchComplaints();
  }, [isAdmin, fetchComplaints]);

  const updateStatus = async (id: string, newStatus: 'pending' | 'in_progress' | 'resolved') => {
    setUpdatingId(id);
    const { error } = await supabase.from('complaints').update({ status: newStatus }).eq('id', id);
    setUpdatingId(null);

    if (error) {
      Alert.alert('Update Failed', error.message);
      return;
    }

    setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
  };

  if (authLoading || isAdmin === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.noAccessText}>Admin access required.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: '#1d4ed8', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Panel</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1d4ed8" />
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.category}>{item.category}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              {item.location_text ? (
                <Text style={styles.location}>📍 {item.location_text}</Text>
              ) : null}

              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      item.status === status && styles.statusButtonActive,
                    ]}
                    disabled={updatingId === item.id}
                    onPress={() => updateStatus(item.id, status)}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        item.status === status && styles.statusButtonTextActive,
                      ]}
                    >
                      {STATUS_LABELS[status]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noAccessText: { fontSize: 15, color: '#6b7280' },
  header: { fontSize: 22, fontWeight: '800', color: '#111827', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  category: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 6 },
  location: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  statusButtonActive: { backgroundColor: '#1d4ed8' },
  statusButtonText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  statusButtonTextActive: { color: '#fff' },
});
