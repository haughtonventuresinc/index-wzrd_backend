const express = require("express");
const router = express.Router();
const axios = require("axios");


// Function to generate realistic market data for a symbol
function generateMarketData(symbol, basePrice) {
  // Get today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate realistic pivot points based on the base price
  const pivotPoint = Math.round(basePrice * 100) / 100;
  const r1 = Math.round((pivotPoint + (pivotPoint * 0.005)) * 100) / 100;
  const r2 = Math.round((r1 + (pivotPoint * 0.008)) * 100) / 100;
  const r3 = Math.round((r2 + (pivotPoint * 0.01)) * 100) / 100;
  const s1 = Math.round((pivotPoint - (pivotPoint * 0.005)) * 100) / 100;
  const s2 = Math.round((s1 - (pivotPoint * 0.008)) * 100) / 100;
  const s3 = Math.round((s2 - (pivotPoint * 0.01)) * 100) / 100;

  // Generate highs and lows
  const dailyHigh = Math.round((pivotPoint + (pivotPoint * 0.015)) * 100) / 100;
  const dailyLow = Math.round((pivotPoint - (pivotPoint * 0.015)) * 100) / 100;
  const weeklyHigh = Math.round((pivotPoint + (pivotPoint * 0.03)) * 100) / 100;
  const weeklyLow = Math.round((pivotPoint - (pivotPoint * 0.025)) * 100) / 100;
  const monthlyHigh = Math.round((pivotPoint + (pivotPoint * 0.05)) * 100) / 100;
  const monthlyLow = Math.round((pivotPoint - (pivotPoint * 0.04)) * 100) / 100;

  return {
    symbol,
    date: formattedDate,
    pivotPoints: [
      { label: 'PP', value: pivotPoint.toFixed(2) },
      { label: 'R1', value: r1.toFixed(2) },
      { label: 'R2', value: r2.toFixed(2) },
      { label: 'R3', value: r3.toFixed(2) },
      { label: 'S1', value: s1.toFixed(2) },
      { label: 'S2', value: s2.toFixed(2) },
      { label: 'S3', value: s3.toFixed(2) }
    ],
    highsLows: {
      'Daily High': dailyHigh.toFixed(2),
      'Daily Low': dailyLow.toFixed(2),
      'Weekly High': weeklyHigh.toFixed(2),
      'Weekly Low': weeklyLow.toFixed(2),
      'Monthly High': monthlyHigh.toFixed(2),
      'Monthly Low': monthlyLow.toFixed(2)
    }
  };
}

// Fetch real-time market data from Yahoo Finance API
async function fetchYahooFinanceData(symbol) {
  try {
    // Map SPX to ^SPX for Yahoo Finance
    const yahooSymbol = symbol === 'SPX' ? '^SPX' : symbol;
    
    console.log(`[${new Date().toISOString()}] Fetching real-time data for ${symbol} (${yahooSymbol}) from Yahoo Finance`);
    
    // Configure axios with headers that mimic a browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    };
    
    // Make the request to Yahoo Finance API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1mo`;
    const response = await axios.get(url, { headers });
    
    if (!response.data || !response.data.chart || !response.data.chart.result || response.data.chart.result.length === 0) {
      throw new Error('Invalid response from Yahoo Finance API');
    }
    
    const result = response.data.chart.result[0];
    const quote = result.indicators.quote[0];
    const timestamps = result.timestamp;
    
    // Get the most recent trading day's data
    const lastIndex = timestamps.length - 1;
    
    // Extract OHLC data
    const open = quote.open[lastIndex];
    const high = quote.high[lastIndex];
    const low = quote.low[lastIndex];
    const close = quote.close[lastIndex];
    
    // Get previous day's data for calculating pivot points
    const prevClose = quote.close[lastIndex - 1];
    const prevHigh = quote.high[lastIndex - 1];
    const prevLow = quote.low[lastIndex - 1];
    
    console.log(`[${new Date().toISOString()}] Successfully fetched data for ${symbol}:`);
    console.log(`  Open: ${open}, High: ${high}, Low: ${low}, Close: ${close}`);
    console.log(`  Prev Close: ${prevClose}, Prev High: ${prevHigh}, Prev Low: ${prevLow}`);
    
    // Calculate pivot points based on previous day's data using Barchart's formula
    const pivotPoint = (prevHigh + prevLow + prevClose) / 3;
    const r1 = (2 * pivotPoint) - prevLow;
    const r2 = pivotPoint + (prevHigh - prevLow);
    const r3 = r1 + (prevHigh - prevLow); // Barchart formula for R3
    const s1 = (2 * pivotPoint) - prevHigh;
    const s2 = pivotPoint - (prevHigh - prevLow);
    const s3 = s1 - (prevHigh - prevLow); // Barchart formula for S3
    
    // Calculate standard deviations (typically based on volatility)
    const stdDev = (prevHigh - prevLow) * 0.2; // Approximation
    const sd1r = close + stdDev;
    const sd2r = close + (stdDev * 2);
    const sd3r = close + (stdDev * 3);
    const sd1s = close - stdDev;
    const sd2s = close - (stdDev * 2);
    const sd3s = close - (stdDev * 3);
    
    // Calculate Fibonacci retracements
    // Using 4-week high and low for calculations
    const fourWeekHigh = Math.max(...quote.high);
    const fourWeekLow = Math.min(...quote.low.filter(val => val !== null));
    const fibRange = fourWeekHigh - fourWeekLow;
    const fib382 = fourWeekHigh - (fibRange * 0.382);
    const fib50 = fourWeekHigh - (fibRange * 0.5);
    const fib618 = fourWeekHigh - (fibRange * 0.618);
    
    // Get historical data for weekly and monthly highs/lows
    const weeklyHigh = Math.max(...quote.high.slice(-5));
    const weeklyLow = Math.min(...quote.low.slice(-5).filter(val => val !== null));
    const monthlyHigh = Math.max(...quote.high);
    const monthlyLow = Math.min(...quote.low.filter(val => val !== null));
    
    // Format the data to match Barchart's structure more closely
    const data = {
      symbol,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      pivotPoints: [
        { label: 'PP', value: pivotPoint.toFixed(2) },
        { label: 'R1', value: r1.toFixed(2) },
        { label: 'R2', value: r2.toFixed(2) },
        { label: 'R3', value: r3.toFixed(2) },
        { label: 'S1', value: s1.toFixed(2) },
        { label: 'S2', value: s2.toFixed(2) },
        { label: 'S3', value: s3.toFixed(2) }
      ],
      standardDeviations: [
        { label: '1 SD Resistance', value: sd1r.toFixed(2) },
        { label: '2 SD Resistance', value: sd2r.toFixed(2) },
        { label: '3 SD Resistance', value: sd3r.toFixed(2) },
        { label: '1 SD Support', value: sd1s.toFixed(2) },
        { label: '2 SD Support', value: sd2s.toFixed(2) },
        { label: '3 SD Support', value: sd3s.toFixed(2) }
      ],
      fibonacci: [
        { label: '38.2% Retracement', value: fib382.toFixed(2) },
        { label: '50% Retracement', value: fib50.toFixed(2) },
        { label: '61.8% Retracement', value: fib618.toFixed(2) }
      ],
      highsLows: {
        'Daily High': high.toFixed(2),
        'Daily Low': low.toFixed(2),
        'Weekly High': weeklyHigh.toFixed(2),
        'Weekly Low': weeklyLow.toFixed(2),
        'Monthly High': monthlyHigh.toFixed(2),
        'Monthly Low': monthlyLow.toFixed(2),
        'Previous Close': prevClose.toFixed(2)
      },
      keyLevels: [
        { label: 'Current Price', value: close.toFixed(2) },
        { label: 'Open', value: open.toFixed(2) },
        { label: 'Previous Close', value: prevClose.toFixed(2) }
      ],
      isRealData: true,
      dataSource: 'Yahoo Finance API (Formatted to match Barchart)',
      lastUpdated: new Date().toISOString(),
      currentPrice: close.toFixed(2)
    };
    
    console.log(`[${new Date().toISOString()}] Successfully calculated pivot points for ${symbol}`);
    return data;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching ${symbol} data from Yahoo Finance:`, error.message);
    
    // Fall back to mock data on error
    console.log(`[${new Date().toISOString()}] Falling back to mock data for ${symbol} due to API error`);
    const basePrice = symbol === 'SPX' ? 5080.75 : 508.25;
    const mockData = generateMarketData(symbol, basePrice);
    mockData.isRealData = false;
    mockData.dataSource = `Mock Data (Yahoo Finance API Error: ${error.message})`;
    return mockData;
  }
}

// Get SPX and SPY market data
router.get("/market-data", async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] Received request for market data`);
    
    const [spxData, spyData] = await Promise.all([
      fetchYahooFinanceData("SPX"),
      fetchYahooFinanceData("SPY")
    ]);
    
    console.log(`[${new Date().toISOString()}] Successfully processed market data request`);
    
    res.json({
      success: true,
      data: {
        spx: spxData,
        spy: spyData
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching market data:`, error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch market data"
    });
  }
});

module.exports = router;
