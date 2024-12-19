interface CachedData<T> {
  timestamp: number;
  value: T;
}

/**
 * Retrieves cached data for the given key
 * Returns null if data is missing or expired (24 hours)
 */
export const getCachedData = <T>(key: string): T | null => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;

    const cachedData: CachedData<T> = JSON.parse(data);
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    if (Date.now() - cachedData.timestamp > TWENTY_FOUR_HOURS) {
      localStorage.removeItem(key); // Clean up expired data
      return null;
    }

    return cachedData.value;
  } catch (error) {
    console.error('Error retrieving cached data:', error);
    return null;
  }
};

/**
 * Stores data in localStorage with current timestamp
 * Automatically handles JSON serialization
 */
export const setCachedData = <T>(key: string, value: T): void => {
  try {
    const cachedData: CachedData<T> = {
      timestamp: Date.now(),
      value
    };
    localStorage.setItem(key, JSON.stringify(cachedData));
  } catch (error) {
    console.error('Error caching data:', error);
  }
};
