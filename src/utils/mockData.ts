import { PriceData } from '../types';

const generateMockData = (
  startDate: Date,
  count: number,
  baseValue: number,
  volatility: number
): PriceData[] => {
  const data: PriceData[] = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setHours(date.getHours() - i);
    const randomChange = (Math.random() - 0.5) * volatility;
    const value = baseValue + randomChange;
    data.push({
      timestamp: date.toISOString(),
      value: Number(value.toFixed(4))
    });
  }
  return data.reverse();
};

export const getMockGoldData = (dimension: string): PriceData[] => {
  const now = new Date();
  switch (dimension) {
    case 'hour':
      return generateMockData(now, 24, 14000, 100);
    case 'day':
      return generateMockData(now, 30, 14000, 200);
    case 'week':
      return generateMockData(now, 12, 14000, 300);
    case 'month':
      return generateMockData(now, 12, 14000, 400);
    case 'year':
      return generateMockData(now, 5, 14000, 500);
    default:
      return [];
  }
};

export const getMockForexData = (dimension: string): PriceData[] => {
  const now = new Date();
  switch (dimension) {
    case 'hour':
      return generateMockData(now, 24, 0.0470, 0.0005);
    case 'day':
      return generateMockData(now, 30, 0.0470, 0.001);
    case 'week':
      return generateMockData(now, 12, 0.0470, 0.002);
    case 'month':
      return generateMockData(now, 12, 0.0470, 0.003);
    case 'year':
      return generateMockData(now, 5, 0.0470, 0.004);
    default:
      return [];
  }
};
