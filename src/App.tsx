import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { RefreshCw } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TimeDimensionSelector } from './components/TimeDimensionSelector'
import { fetchHistoricalGold, fetchHistoricalForex, formatTimestamp } from './services/api'
import { getCachedData, setCachedData } from './utils/cache'
import { processHistoricalData } from './utils/dataProcessing'
import { PriceData, HistoricalCache } from './types'
import { getMockGoldData, getMockForexData } from './utils/mockData'

const USE_MOCK_DATA = false

function App() {
  const [timeDimension, setTimeDimension] = useState('hour')
  const [goldPrice, setGoldPrice] = useState<PriceData[]>([])
  const [exchangeRate, setExchangeRate] = useState<PriceData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historicalGold, setHistoricalGold] = useState<PriceData[]>([])
  const [historicalExchange, setHistoricalExchange] = useState<PriceData[]>([])

  const fetchHistoricalData = async (dimension: string) => {
    const startTime = performance.now();
    setLoading(true);
    setError(null);

    const cacheKey = `historical-${dimension}`;
    const cachedData = getCachedData<HistoricalCache>(cacheKey);

    if (cachedData !== null && 'gold' in cachedData && 'exchange' in cachedData) {
      console.log(`Cache hit for ${dimension} data. Time: ${performance.now() - startTime}ms`);
      setHistoricalGold(cachedData.gold);
      setHistoricalExchange(cachedData.exchange);
      setLoading(false);
      return;
    }

    console.log(`Cache miss for ${dimension} data`);
    const apiStartTime = performance.now();

    try {
      if (USE_MOCK_DATA) {
        const goldData = getMockGoldData(dimension);
        const exchangeData = getMockForexData(dimension);
        setHistoricalGold(goldData);
        setHistoricalExchange(exchangeData);
        setCachedData(cacheKey, {
          gold: goldData,
          exchange: exchangeData
        });
        setLoading(false);
        return;
      }

      const [goldData, exchangeData] = await Promise.all([
        fetchHistoricalGold('CNY', dimension),
        fetchHistoricalForex('JPY', 'CNY', dimension)
      ]);

      console.log(`API fetch time: ${performance.now() - apiStartTime}ms`);
      const processStartTime = performance.now();

      const processedGoldData = processHistoricalData(goldData, dimension);
      const processedExchangeData = processHistoricalData(exchangeData, dimension);

      console.log(`Data processing time: ${performance.now() - processStartTime}ms`);

      setHistoricalGold(processedGoldData);
      setHistoricalExchange(processedExchangeData);

      setCachedData(cacheKey, {
        gold: processedGoldData,
        exchange: processedExchangeData
      });

      console.log(`Total operation time: ${performance.now() - startTime}ms`);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setError('历史数据获取失败，请稍后重试');
    }
    setLoading(false);
  };

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (USE_MOCK_DATA) {
        const goldData = getMockGoldData('hour');
        const exchangeData = getMockForexData('hour');
        setGoldPrice(goldData);
        setExchangeRate(exchangeData);
        return;
      }

      // Fetch real-time data using our API services
      const [goldData, exchangeData] = await Promise.all([
        fetchHistoricalGold('CNY', 'hour'),
        fetchHistoricalForex('JPY', 'CNY', 'hour')
      ]);

      // Update gold price
      setGoldPrice(goldData);

      // Update exchange rate
      setExchangeRate(exchangeData);

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('数据获取失败，请稍后重试')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Fetch every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchHistoricalData(timeDimension);
  }, [timeDimension]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">实时价格追踪</h1>
          <Button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>黄金价格 (CNY/盎司)</CardTitle>
              <TimeDimensionSelector
                value={timeDimension}
                onChange={(value) => {
                  setTimeDimension(value);
                  fetchHistoricalData(value);
                }}
              />
            </CardHeader>
            <CardContent className="h-80">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-gray-500">加载中...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeDimension === 'hour' ? goldPrice : historicalGold}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#374151"
                      fontSize={12}
                      tickFormatter={(value) => formatTimestamp(value, timeDimension)}
                    />
                    <YAxis
                      stroke="#374151"
                      fontSize={12}
                      tickFormatter={(value) => `¥${value.toFixed(2)}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`¥${value.toFixed(2)}`, '价格']}
                      labelFormatter={(label) => `时间: ${formatTimestamp(label, timeDimension)}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>日元汇率 (CNY/JPY)</CardTitle>
              <TimeDimensionSelector
                value={timeDimension}
                onChange={(value) => {
                  setTimeDimension(value);
                  fetchHistoricalData(value);
                }}
              />
            </CardHeader>
            <CardContent className="h-80">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-gray-500">加载中...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeDimension === 'hour' ? exchangeRate : historicalExchange}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#374151"
                      fontSize={12}
                      tickFormatter={(value) => formatTimestamp(value, timeDimension)}
                    />
                    <YAxis
                      stroke="#374151"
                      fontSize={12}
                      tickFormatter={(value) => `¥${value.toFixed(4)}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`¥${value.toFixed(4)}`, '汇率']}
                      labelFormatter={(label) => `时间: ${formatTimestamp(label, timeDimension)}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default App
