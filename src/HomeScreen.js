  //e018353e5ada81bd7e4b7f5460b494
    //https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}
    //openuv-9uguimrm3z441lx-io
    //https://api.openuv.io/api/v1/uv?lat=${latitude}&lng=${longitude}


    import React, { useState, useEffect } from 'react';
    import { 
      View, 
      Text, 
      TextInput, 
      TouchableOpacity, 
      StyleSheet, 
      ActivityIndicator 
    } from 'react-native';
    import MapView, { Marker } from 'react-native-maps';
    import * as Location from 'expo-location';
    
    export default function HomeScreen() {
      // State variables
      const [location, setLocation] = useState(''); 
      const [latitude, setLatitude] = useState(49.2827); // Default to Vancouver
      const [longitude, setLongitude] = useState(-123.1207); // Default to Vancouver
      const [uvIndex, setUvIndex] = useState(null);
      const [errorMsg, setErrorMsg] = useState(null);
      const [isLoading, setIsLoading] = useState(false);
      const [initialRegion, setInitialRegion] = useState({
        latitude: 49.2827,
        longitude: -123.1207,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    
      // Fetch UV Index function
      const fetchUvIndex = async (latitude, longitude) => {
        const API_KEY = "6ce018353e5ada81bd7e4b7f5460b494";
        const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}`;
        
        try {
          const response = await fetch(url);
          const data = await response.json();
          return data.current.uvi; // UV index is under current.uvi in OpenWeatherMap's One Call API
        } catch (error) {
          console.error("Error fetching UV data:", error);
          setErrorMsg("Failed to fetch UV index");
          return null;
        }
      };
    
      // Fetch City Coordinates function
      const fetchCityCoordinates = async (cityName) => {
        try {
          // Note: Replace with a real geocoding API in production
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${cityName}`);
          const data = await response.json();
          
          if (data && data.length > 0) {
            return {
              latitude: parseFloat(data[0].lat),
              longitude: parseFloat(data[0].lon)
            };
          }
          return null;
        } catch (error) {
          console.error("Error fetching coordinates:", error);
          setErrorMsg("Could not find city coordinates");
          return null;
        }
      };
    
      // Initial location fetch
      useEffect(() => {
        const fetchInitialLocation = async () => {
          setIsLoading(true);
          
          try {
            // Request permissions
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
              // If permissions are denied, show an alert and set a default location
              Alert.alert(
                "Location Permission",
                "Permission to access location was denied. Using default location.",
                [{
                  text: "OK",
                  onPress: () => {
                    // Default to a fallback location (e.g., New York City)
                    const fallbackLat = 40.7128;
                    const fallbackLng = -74.0060;
                    
                    setLatitude(fallbackLat);
                    setLongitude(fallbackLng);
                    
                    setInitialRegion({
                      latitude: fallbackLat,
                      longitude: fallbackLng,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    });
    
                    // Fetch UV index for fallback location
                    fetchUvIndex(fallbackLat, fallbackLng).then(setUvIndex);
                    
                    setIsLoading(false);
                  }
                }]
              );
              return;
            }
    
            // Get current location
            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            
            // Update states with current location
            setLatitude(latitude);
            setLongitude(longitude);
            
            // Set initial region for the map
            setInitialRegion({
              latitude,
              longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
    
            // Fetch UV index for current location
            const uvData = await fetchUvIndex(latitude, longitude);
            setUvIndex(uvData);
          } catch (error) {
            // Handle any unexpected errors
            Alert.alert(
              "Location Error", 
              "Could not retrieve your location. Using default location.",
              [{
                text: "OK",
                onPress: () => {
                  // Default to a fallback location
                  const fallbackLat = 40.7128;
                  const fallbackLng = -74.0060;
                  
                  setLatitude(fallbackLat);
                  setLongitude(fallbackLng);
                  
                  setInitialRegion({
                    latitude: fallbackLat,
                    longitude: fallbackLng,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  });
    
                  // Fetch UV index for fallback location
                  fetchUvIndex(fallbackLat, fallbackLng).then(setUvIndex);
                }
              }]
            );
          } finally {
            setIsLoading(false);
          }
        };
    
        fetchInitialLocation();
      }, []);
    
      // Search handler
      const handleSearch = async () => {
        if (!location) {
          setErrorMsg("Please enter a city name");
          return;
        }
    
        setIsLoading(true);
        setErrorMsg(null);
    
        try {
          const coordinates = await fetchCityCoordinates(location);
          
          if (coordinates) {
            setLatitude(coordinates.latitude);
            setLongitude(coordinates.longitude);
            
            setInitialRegion({
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
    
            // Fetch UV index for searched city
            const uvData = await fetchUvIndex(coordinates.latitude, coordinates.longitude);
            setUvIndex(uvData);
          } else {
            setErrorMsg("City not found. Please try again.");
          }
        } catch (error) {
          setErrorMsg("Search failed. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };
    
      // UV Index Color Determination
      const getUVIndexColor = (index) => {
        if (index <= 2) return 'green';
        if (index <= 5) return 'orange';
        if (index <= 7) return 'red';
      };
    
      const getUVIndexInfo = (uvIndex) => {
        if (uvIndex <= 2) {
          return {
            color: 'green',
            risk: 'Minimal Risk',
            message: 'Safe to stay outdoors. You can comfortably enjoy outdoor activities with minimal sun protection.'
          };
        } else if (uvIndex <= 5) {
          return {
            color: 'orange',
            risk: 'Moderate Risk',
            message: 'Seek shade during midday hours, wear protective clothing, and use SPF 30+ sunscreen. Limit exposure between 10 AM and 4 PM.'
          };
        } else if (uvIndex <= 7) {
          return {
            color: 'red',
            risk: 'High Risk',
            message: 'Avoid being outside during midday hours. Use maximum protection: SPF 50+ sunscreen, protective clothing, wide-brimmed hat, and seek shade.'
          };
        
        }
      };
    
      return (
        
        <View style={styles.container}>
    
        <View style={styles.searchContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter city name"
              value={location}
              onChangeText={setLocation}
            />
            <TouchableOpacity 
              style={styles.searchButton} 
              onPress={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>
    
      {uvIndex !== null && (
        <View style={styles.uvContainer}>
        <Text style={styles.uvText}>
          UV Index:
        </Text>
        <Text 
          style={[styles.uvIndexValue, { color: getUVIndexInfo(uvIndex).color }]}
        >
          {`${uvIndex.toFixed(1)} - ${getUVIndexInfo(uvIndex).risk}`}
        </Text>
        <Text style={styles.uvMessageText}>
          {getUVIndexInfo(uvIndex).message}
        </Text>
      </View>
       
      )}
     
        
          {/* Error Message */}
          {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
    
          {/* Map Container */}
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={initialRegion}
            >
              <Marker
                coordinate={{
                  latitude: latitude,
                  longitude: longitude
                }}
                title="Current Location"
              />
            </MapView>
          </View>
        </View>
      );
    }
    
    // Stylesheet (exactly as you provided)
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 10,
        backgroundColor: '#FFFAEC',
      },
      mapContainer: {
        width: '90%',
        height: '60%',
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 30,
      },
      map: {
        width: '100%',
        height: '100%',
      },
      searchContainer: {
        flexDirection: 'row',
        marginTop: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      },
      input: {
        flex: 1,
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginRight: 5,
      },
      searchButton: {
        backgroundColor: '#007BFF',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 5,
      },
      searchButtonText: {
        color: 'white',
        fontWeight: 'bold',
      },
      uvText: {
        marginTop: 15,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
      },
      uvIndexValue: {
    
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
      },
      error: {
        marginTop: 20,
        fontSize: 16,
        color: 'red',
      },
      uvContainer: {
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 10,
      },
      uvMessageText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 10,
      },
    
      uvMessageContainer:{
        marginTop:5,
        padding:2,
        borderRadius:10,
        width:'100%',
        
    
      },
    
    });