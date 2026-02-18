// Get current user location
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

// Watch location changes
export const watchLocation = (onLocationChange, onError) => {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported'));
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onLocationChange({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    onError,
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );

  return watchId;
};

// Stop watching location
export const stopWatchingLocation = (watchId) => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance.toFixed(2);
};

// Format location for display
export const formatLocation = (lat, lng) => {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

// Get Google Maps link
export const getGoogleMapsLink = (lat, lng) => {
  return `https://www.google.com/maps?q=${lat},${lng}`;
};
