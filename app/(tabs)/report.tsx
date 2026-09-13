import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = ['Roads & Traffic', 'Electricity', 'Water & Sewage', 'Cleanliness', 'Safety', 'Other'];

export default function ReportScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to continue.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });

    if (!result.canceled && result.assets?.[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!imageUri || !session?.user) return null;

    try {
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('complaint-photos')
        .upload(fileName, arrayBuffer, { contentType: `image/${fileExt}` });

      if (uploadError) {
        console.warn('Photo upload error:', uploadError.message);
        return null;
      }

      const { data } = supabase.storage.from('complaint-photos').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) {
      console.warn('Photo upload exception:', e);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing info', 'Please fill in title and description.');
      return;
    }
    if (!session?.user) {
      Alert.alert('Not logged in', 'Please sign in again.');
      return;
    }

    setSubmitting(true);

    const photoUrl = await uploadPhoto();

    const { error } = await supabase.from('complaints').insert({
      user_id: session.user.id,
      category,
      title: title.trim(),
      description: description.trim(),
      location_text: locationText.trim() || null,
      photo_url: photoUrl,
    });

    setSubmitting(false);

    if (error) {
      Alert.alert('Submission Failed', error.message);
      return;
    }

    Alert.alert('Complaint Submitted', 'Thank you! Your civic report has been received.', [
      {
        text: 'View Feed',
        onPress: () => {
          setTitle('');
          setDescription('');
          setLocationText('');
          setImageUri(null);
          router.push('/(tabs)');
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.header}>New Report</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Open manhole on main road"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide specific details about the issue..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Road, Sector, Landmark or Area..."
            value={locationText}
            onChangeText={setLocationText}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Photo Evidence</Text>
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(true)}>
              <Text style={styles.photoButtonText}>📷 Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(false)}>
              <Text style={styles.photoButtonText}>🖼️ Upload Image</Text>
            </TouchableOpacity>
          </View>
          {imageUri ? (
            <View>
              <Image source={{ uri: imageUri }} style={styles.preview} />
              <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removePhoto}>
                <Text style={styles.removePhotoText}>Remove Photo</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Complaint</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', paddingTop: 56 },
  header: { fontSize: 22, fontWeight: '800', color: '#111827', paddingHorizontal: 16, marginBottom: 16 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  categoryChipActive: { backgroundColor: '#1d4ed8' },
  categoryChipText: { color: '#374151', fontWeight: '600', fontSize: 13 },
  categoryChipTextActive: { color: '#fff' },
  photoRow: { flexDirection: 'row', gap: 12 },
  photoButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 14,
    backgroundColor: '#eff6ff',
  },
  photoButtonText: { color: '#1d4ed8', fontWeight: '700', fontSize: 13 },
  preview: { width: '100%', height: 180, borderRadius: 10, marginTop: 12 },
  removePhoto: { alignSelf: 'center', marginTop: 8 },
  removePhotoText: { color: '#dc2626', fontWeight: '600', fontSize: 12 },
  submitButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
