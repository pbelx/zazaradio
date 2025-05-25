// RadioStreamApp.tsx

import { Audio } from 'expo-av';
import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const randomImages = [
  { uri: 'https://picsum.photos/800?nature' },
  { uri: 'https://picsum.photos/800?music' },
  { uri: 'https://picsum.photos/800?radio' },
];
const { width } = Dimensions.get('window');

interface Station {
  name: string;
  url: string;
}

const RadioStreamApp = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStationIndex, setCurrentStationIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  // useRef to hold the Audio.Sound object
  const sound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Configure audio mode for background playback
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      // interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      // interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
    });

    const interval = setInterval(() => {
      setImageIndex((prevIndex) => (prevIndex + 1) % randomImages.length);
    }, 5000); // Change image every 5 seconds

    return () => {
      clearInterval(interval);
      // Unload sound when component unmounts
      if (sound.current) {
        sound.current.unloadAsync();
        sound.current = null;
      }
    };
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
        // Fallback to sample data in case of an error
        setStations([
          { name: 'Sample Radio 1 (Error Fallback)', url: 'http://stream.psychomed.gr:8000/stream' }, // Example working stream
          { name: 'Sample Radio 2 (Error Fallback)', url: 'http://radio.flexi.org:8000/radio.mp3' } // Example working stream
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  const playStation = async (station: Station, index: number) => {
    try {
      // If there's an existing sound, unload it first
      if (sound.current) {
        await sound.current.unloadAsync();
        sound.current = null;
      }

      // Create new sound instance
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: station.url },
        { shouldPlay: true }
      );
      sound.current = newSound;
      setIsPlaying(true);
      setCurrentStationIndex(index);

      // You can also add a listener for playback status updates
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
        }
      });
    } catch (e) {
      console.error('Playback error:', e);
      setIsPlaying(false);
      setCurrentStationIndex(null);
      setError('Failed to play station. Please try another one.');
    }
  };

  const togglePlayPause = async () => {
    if (!sound.current) {
      // If no station is selected or loaded, do nothing or show a message
      setError('No station selected to play/pause.');
      return;
    }

    if (isPlaying) {
      await sound.current.pauseAsync();
    } else {
      await sound.current.playAsync();
    }
    // The setOnPlaybackStatusUpdate listener will update isPlaying automatically
  };

  const stopPlayback = async () => {
    if (sound.current) {
      await sound.current.stopAsync();
      await sound.current.unloadAsync();
      sound.current = null;
    }
    setIsPlaying(false);
    setCurrentStationIndex(null);
    setError(''); // Clear any playback errors
  };

  const renderStation = ({ item, index }: { item: Station; index: number }) => (
    <TouchableOpacity
      onPress={() => playStation(item, index)}
      style={[
        styles.stationItem,
        currentStationIndex === index && styles.activeStation,
      ]}
    >
      <Ionicons name="radio" size={40} color="#fff" style={styles.radioIcon} />
      <Text style={styles.stationName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Radio App' }} />
      <ImageBackground
        source={randomImages[imageIndex]}
        style={styles.headerImage}
        imageStyle={{
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}
      >
        {/* Other header content */}
      </ImageBackground>
      <Text style={styles.title}>Radio Stations</Text>
      <Text style={styles.subtitle}>
        {loading ? 'Loading...' : `${stations.length} available`}
      </Text>

      {error !== '' && <Text style={styles.errorText}>Error: {error}</Text>}

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
            name={isPlaying ? 'pause' : 'play'}
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
    paddingTop: 10,
  },
  headerImage: {
    width: '100%',
    height: 200,
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: '#000',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  subtitle: {
    color: '#aaa',
    marginTop: 4,
    paddingHorizontal: 16,
    paddingBottom: 10,
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
  radioIcon: {
    width: 50,
    height: 50,
    textAlign: 'center',
    textAlignVertical: 'center',
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
    flexDirection: 'row',
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
  },
});