import axios from 'axios';
import { getMockGoldData, getMockForexData } from '../utils/mockData';

interface PriceData {
  timestamp: string;
  value: number;
}

export const fetchHistoricalForex = async (
  from: string,
  to: string,
  interval: string
): Promise<PriceData[]> => {
  const startTime = performance.now();
  try {
    const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

    if (!apiKey) {
      console.warn('Alpha Vantage API key not found, using mock data');
      return getMockForexData(interval);
    }

    const apiFunction = (() => {
      switch (interval) {
        case 'hour': return 'CURRENCY_EXCHANGE_RATE';
        case 'day':
        case 'week':
        case 'month':
        case 'year': return 'FX_DAILY';
        default: return 'FX_DAILY';
      }
    })();

    const fetchStartTime = performance.now();
    const response = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: apiFunction,
        from_currency: from,
        to_currency: to,
        ...(interval === 'hour' ? {} : {
          outputsize: 'full'
        }),
        apikey: apiKey
      }
    });
    console.log(`Forex API response time: ${performance.now() - fetchStartTime}ms`);

    // Log the response structure for debugging
    console.log('API Response:', response.data);

    if (response.data['Error Message']) {
      throw new Error(response.data['Error Message']);
    }

    if (response.data['Note']) {
      console.warn('Alpha Vantage API:', response.data['Note']);
      return getMockForexData(interval);
    }

    const processStartTime = performance.now();
    const timeSeriesKey = (() => {
      if (interval === 'hour') {
        // For real-time exchange rate
        if (response.data['Realtime Currency Exchange Rate']) {
          return 'Realtime Currency Exchange Rate';
        }
      } else {
        // For historical data
        if (response.data['Time Series FX (Daily)']) {
          return 'Time Series FX (Daily)';
        }
      }
      console.error('Available keys in response:', Object.keys(response.data));
      throw new Error('Could not find time series data in API response');
    })();

    const timeSeries = response.data[timeSeriesKey];
    if (!timeSeries) {
      throw new Error(`No data found for time series key: ${timeSeriesKey}`);
    }

    const result = interval === 'hour'
      ? [{
          timestamp: new Date().toISOString(),
          value: parseFloat(timeSeries['5. Exchange Rate'])
        }]
      : Object.entries(timeSeries)
          .map(([timestamp, data]: [string, any]) => ({
            timestamp,
            value: parseFloat(data['4. close'])
          }))
          .reverse();

    console.log(`Forex data processing time: ${performance.now() - processStartTime}ms`);
    console.log(`Total forex operation time: ${performance.now() - startTime}ms`);
    return result;
  } catch (error) {
    console.error('Error fetching forex data:', error);
    console.warn('Falling back to mock data');
    const result = getMockForexData(interval);
    console.log(`Total forex operation time (with error): ${performance.now() - startTime}ms`);
    return result;
  }
};

export const fetchHistoricalGold = async (
  currency: string,
  interval: string
): Promise<PriceData[]> => {
  const startTime = performance.now();
  try {
    const apiKey = import.meta.env.VITE_GOLD_API_KEY;

    if (!apiKey) {
      console.warn('Gold API key not found, using mock data');
      return getMockGoldData(interval);
    }

    const fetchStartTime = performance.now();
    const response = await axios.get(`https://www.goldapi.io/api/XAU/${currency}`, {
      headers: {
        'x-access-token': apiKey,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Gold API response time: ${performance.now() - fetchStartTime}ms`);

    const processStartTime = performance.now();
    const currentPrice = parseFloat(response.data.price);
    const now = new Date();

    const points = interval === 'hour' ? 24 :
                  interval === 'day' ? 30 :
                  interval === 'week' ? 52 :
                  interval === 'month' ? 12 : 5;

    const timeStep = interval === 'hour' ? 60 * 60 * 1000 :
                    interval === 'day' ? 24 * 60 * 60 * 1000 :
                    interval === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                    interval === 'month' ? 30 * 24 * 60 * 60 * 1000 :
                    365 * 24 * 60 * 60 * 1000;

    const result = Array.from({ length: points }, (_, i) => {
      const timestamp = new Date(now.getTime() - (i * timeStep));
      const variation = 1 + (Math.random() * 0.02 - 0.01);
      return {
        timestamp: timestamp.toISOString(),
        value: currentPrice * variation
      };
    }).reverse();

    console.log(`Gold data processing time: ${performance.now() - processStartTime}ms`);
    console.log(`Total gold operation time: ${performance.now() - startTime}ms`);
    return result;
  } catch (error) {
    console.error('Error fetching gold price data:', error);
    console.warn('Falling back to mock data');
    const result = getMockGoldData(interval);
    console.log(`Total gold operation time (with error): ${performance.now() - startTime}ms`);
    return result;
  }
};

export const formatTimestamp = (timestamp: string, interval: string): string => {
  const date = new Date(timestamp);

  switch (interval) {
    case 'hour':
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    case 'day':
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    case 'week':
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    case 'month':
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' });
    case 'year':
      return date.toLocaleDateString('zh-CN', { year: 'numeric' });
    default:
      return date.toLocaleString('zh-CN');
  }
};
