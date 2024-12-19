export interface PriceData {
  timestamp: string;
  value: number;
}

export interface HistoricalCache {
  gold: PriceData[];
  exchange: PriceData[];
}
