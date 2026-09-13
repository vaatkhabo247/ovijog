import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

type Complaint = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in_progress' | 'resolved';
  location_text: string | null;
  photo_url: string | null;
  created_at: string;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#fef3c7', text: '#b45309', label: 'Pending' },
  in_progress: { bg: '#dbeafe', text: '#1d4ed8', label: 'In Progress' },
  resolved: { bg: '#d1fae5', text: '#047857', label: 'Resolved' },
};

export default function FeedScreen() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchComplaints = useCallback(async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select('id, title, description, category, status, location_text, photo_url, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) setComplaints(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchComplaints().finally(() => setLoading(false));
    }, [fetchComplaints])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComplaints();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ovijog (অভিযোগ)</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1d4ed8" />
      ) : complaints.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No complaints yet. Be the first to report one!</Text>
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const statusStyle = STATUS_STYLES[item.status] ?? STATUS_STYLES.pending;
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push(`/complaint/${item.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {statusStyle.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>

                {item.photo_url ? (
                  <Image source={{ uri: item.photo_url }} style={styles.photo} resizeMode="contain" />
                ) : null}

                {item.location_text ? (
                  <Text style={styles.location}>📍 {item.location_text}</Text>
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', paddingTop: 56 },
  header: { fontSize: 22, fontWeight: '800', color: '#111827', paddingHorizontal: 16, marginBottom: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', color: '#6b7280', fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryPill: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  categoryText: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 10 },
  description: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  photo: { width: '100%', height: 160, borderRadius: 10, marginTop: 10, backgroundColor: '#f3f4f6' },
  location: { fontSize: 12, color: '#9ca3af', marginTop: 10 },
});
