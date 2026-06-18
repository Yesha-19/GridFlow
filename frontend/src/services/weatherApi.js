/**
 * Service to fetch live weather data for Bengaluru using the OpenWeatherMap API.
 * Falls back to realistic mock weather data if the API key is missing or calls fail.
 */

const BENGALURU_LAT = 12.9716;
const BENGALURU_LON = 77.5946;

// Mock fallback data for Bengaluru (simulating monsoon/rain for test cases)
const MOCK_WEATHER_FALLBACK = {
  temp: 26.4,
  condition: 'Rain',
  description: 'moderate rain',
  icon: '10d',
  isRaining: true,
  humidity: 88,
  windSpeed: 5.8,
  isMock: true
};

/**
 * Fetches the current weather for Bengaluru.
 * @returns {Promise<{temp: number, condition: string, description: string, icon: string, isRaining: boolean, humidity: number, windSpeed: number, isMock: boolean}>}
 */
export async function fetchBengaluruWeather() {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  if (!apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY' || apiKey.trim() === '') {
    console.warn('[weatherApi] OpenWeatherMap API key (VITE_OPENWEATHER_API_KEY) is missing. Using mock weather.');
    return MOCK_WEATHER_FALLBACK;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${BENGALURU_LAT}&lon=${BENGALURU_LON}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API responded with status ${response.status}`);
    }

    const data = await response.json();
    const mainCondition = data.weather[0]?.main || 'Clear';
    const isRaining = ['Rain', 'Drizzle', 'Thunderstorm'].includes(mainCondition);

    return {
      temp: data.main?.temp ?? 27.0,
      condition: mainCondition,
      description: data.weather[0]?.description || 'clear sky',
      icon: data.weather[0]?.icon || '01d',
      isRaining,
      humidity: data.main?.humidity ?? 70,
      windSpeed: data.wind?.speed ?? 3.5,
      isMock: false
    };
  } catch (error) {
    console.warn('[weatherApi] Live weather fetch failed, falling back to mock:', error.message);
    return MOCK_WEATHER_FALLBACK;
  }
}
