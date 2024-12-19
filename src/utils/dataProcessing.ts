import { PriceData } from '../types';

/**
 * Processes historical data based on the given time dimension
 * @param data Raw historical data from API
 * @param dimension Time dimension (hour, day, week, month, year)
 * @returns Processed PriceData array
 */
export const processHistoricalData = (data: any[], dimension: string): PriceData[] => {
  if (!Array.isArray(data) || data.length === 0) return [];

  const now = new Date();
  const result: PriceData[] = [];

  switch (dimension) {
    case 'hour':
      // Last 24 hours, hourly data
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourData = data.filter(d => {
          const dataTime = new Date(d.timestamp);
          return dataTime.getHours() === timestamp.getHours() &&
                 dataTime.getDate() === timestamp.getDate();
        });

        if (hourData.length > 0) {
          const avgValue = hourData.reduce((sum, d) => sum + d.value, 0) / hourData.length;
          result.push({
            timestamp: timestamp.toLocaleTimeString(),
            value: avgValue
          });
        }
      }
      break;

    case 'day':
      // Last 30 days, daily data
      for (let i = 29; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayData = data.filter(d => {
          const dataTime = new Date(d.timestamp);
          return dataTime.getDate() === timestamp.getDate() &&
                 dataTime.getMonth() === timestamp.getMonth();
        });

        if (dayData.length > 0) {
          const avgValue = dayData.reduce((sum, d) => sum + d.value, 0) / dayData.length;
          result.push({
            timestamp: timestamp.toLocaleDateString(),
            value: avgValue
          });
        }
      }
      break;

    case 'week':
      // Last 12 weeks, weekly data
      for (let i = 11; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekData = data.filter(d => {
          const dataTime = new Date(d.timestamp);
          const diffTime = Math.abs(dataTime.getTime() - timestamp.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        });

        if (weekData.length > 0) {
          const avgValue = weekData.reduce((sum, d) => sum + d.value, 0) / weekData.length;
          result.push({
            timestamp: `第${Math.floor((now.getTime() - timestamp.getTime()) / (7 * 24 * 60 * 60 * 1000) + 1)}周`,
            value: avgValue
          });
        }
      }
      break;

    case 'month':
      // Last 12 months, monthly data
      for (let i = 11; i >= 0; i--) {
        const timestamp = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthData = data.filter(d => {
          const dataTime = new Date(d.timestamp);
          return dataTime.getMonth() === timestamp.getMonth() &&
                 dataTime.getFullYear() === timestamp.getFullYear();
        });

        if (monthData.length > 0) {
          const avgValue = monthData.reduce((sum, d) => sum + d.value, 0) / monthData.length;
          result.push({
            timestamp: timestamp.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }),
            value: avgValue
          });
        }
      }
      break;

    case 'year':
      // Last 5 years, yearly data
      for (let i = 4; i >= 0; i--) {
        const timestamp = new Date(now.getFullYear() - i, 0, 1);
        const yearData = data.filter(d => {
          const dataTime = new Date(d.timestamp);
          return dataTime.getFullYear() === timestamp.getFullYear();
        });

        if (yearData.length > 0) {
          const avgValue = yearData.reduce((sum, d) => sum + d.value, 0) / yearData.length;
          result.push({
            timestamp: timestamp.getFullYear().toString() + '年',
            value: avgValue
          });
        }
      }
      break;
  }

  return result;
};
