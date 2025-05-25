// RadioStreamApp.tsx

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TrackPlayer, { Capability, State, usePlaybackState } from 'react-native-track-player';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const artistImages = [
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop"
];

const setupPlayer = async () => {
  if (Platform.OS === 'android') {
    await TrackPlayer.setupPlayer();
    TrackPlayer.updateOptions({
      capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
    });
  }
};

const RadioStreamApp = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStation, setCurrentStation] = useState<number | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const playbackState = usePlaybackState();

  useEffect(() => {
    setupPlayer();

    const interval = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % artistImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const res = await fetch('https://bxmusic-stations-1111.bxmedia.workers.dev/');
        const data = await res.json();

        if (Array.isArray(data)) {
          setStations(data);
        } else {
          throw new Error('Invalid station format.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch stations');
        setStations([
          { name: "Sample Radio 1", url: "https://example.com/stream1" },
          { name: "Sample Radio 2", url: "https://example.com/stream2" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  const playStation = async (station: any, index: number) => {
    if (Platform.OS === 'android') {
      try {
        await TrackPlayer.reset();
        await TrackPlayer.add({
          id: station.name,
          url: station.url,
          title: station.name,
          artist: 'Live Stream',
        });
        await TrackPlayer.play();
        setCurrentStation(index);
      } catch (e) {
        console.error('Playback error:', e);
      }
    } else {
      // Web-specific playback logic
      const audio = new Audio(station.url);
      audio.play();
      setCurrentStation(index);
    }
  };

  const togglePlayPause = async () => {
    if (Platform.OS === 'android') {
      const state = await TrackPlayer.getState();
      if (state === State.Playing) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } else {
      // Web-specific play/pause logic
    }
  };

  const stopPlayback = async () => {
    if (Platform.OS === 'android') {
      await TrackPlayer.stop();
    } else {
      // Web-specific stop logic
    }
  };

  const renderStation = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => playStation(item, index)}
      style={[
        styles.stationItem,
        currentStation === index && styles.activeStation
      ]}
    >
      <Image
        source={{ uri: artistImages[index % artistImages.length] }}
        style={styles.stationImage}
      />
      <Text style={styles.stationName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Image source={{ uri: artistImages[imageIndex] }} style={styles.heroImage} />

      <View style={styles.header}>
        <Text style={styles.title}>Radio Stations</Text>
        <Text style={styles.subtitle}>
          {loading ? 'Loading...' : `${stations.length} available`}
        </Text>
      </View>

      {error !== '' && (
        <Text style={styles.errorText}>Error: {error}</Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <FlatList
          data={stations}
          renderItem={renderStation}
          keyExtractor={(item, idx) => `${item.name}-${idx}`}
          contentContainerStyle={styles.stationList}
        />
      )}

      <View style={styles.controls}>
        <TouchableOpacity onPress={togglePlayPause}>
          <Ionicons
            name={playbackState === State.Playing ? 'pause' : 'play'}
            size={36}
            color="#fff"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={stopPlayback} style={{ marginLeft: 20 }}>
          <Ionicons name="stop" size={36} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RadioStreamApp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 40,
  },
  heroImage: {
    width,
    height: 200,
    resizeMode: 'cover',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    color: '#aaa',
    marginTop: 4,
  },
  errorText: {
    color: 'red',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  stationList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  stationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
  },
  activeStation: {
    backgroundColor: '#444',
  },
  stationImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  stationName: {
    color: '#fff',
    fontSize: 16,
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 50,
  },
});