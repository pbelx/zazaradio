// RadioStreamApp.tsx

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TrackPlayer, { Capability, State, State as TrackPlayerState, usePlaybackState } from 'react-native-track-player';
import Ionicons from 'react-native-vector-icons/Ionicons';

const randomImages = [
  { uri: "https://picsum.photos/800?nature" },
  { uri: "https://picsum.photos/800?music" },
  { uri: "https://picsum.photos/800?radio" },
];
const { width } = Dimensions.get('window');

const setupPlayer = async () => {
  await TrackPlayer.setupPlayer();
  TrackPlayer.updateOptions({
    capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
  });
};

interface Station {
  name: string;
  url: string;
}

const RadioStreamApp = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStation, setCurrentStation] = useState<number | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const playbackState = usePlaybackState() as unknown as TrackPlayerState;

  useEffect(() => {
    setupPlayer();

    const interval = setInterval(() => {
      setImageIndex((prevIndex) => (prevIndex + 1) % randomImages.length);
    }, 5000); // Change image every 3 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
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

  const playStation = async (station: Station, index: number) => {
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
  };

  const togglePlayPause = async () => {
    const state = await TrackPlayer.getState();
    if (state === State.Playing) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  const stopPlayback = async () => {
    await TrackPlayer.stop();
    setCurrentStation(null); // Reset current station
  };

  const renderStation = ({ item, index }: { item: Station, index: number }) => (
    <TouchableOpacity
      onPress={() => playStation(item, index)}
      style={[
        styles.stationItem,
        currentStation === index && styles.activeStation
      ]}
    >
      <Ionicons name="radio" size={40} color="#fff" style={styles.radioIcon} />
      <Text style={styles.stationName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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
        {loading ? "Loading..." : `${stations.length} available`}
      </Text>

      {error !== "" && <Text style={styles.errorText}>Error: {error}</Text>}

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
            name={playbackState === State.Playing ? "pause" : "play"}
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