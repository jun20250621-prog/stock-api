const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// Cache to reduce API calls
let cache = {};
const CACHE_TTL = 60000; // 1 minute

// Helper: get cached data or fetch fresh
async function getWithCache(key, fetcher, ttl = CACHE_TTL) {
  const now = Date.now();
  if (cache[key] && (now - cache[key].time) < ttl) {
    return cache[key].data;
  }
  try {
    const data = await fetcher();
    cache[key] = { time: now, data };
    return data;
  } catch (e) {
    // Return cached if available, even if expired
    if (cache[key]) return cache[key].data;
    throw e;
  }
}

// 1. VIX Index (from Yahoo Finance)
async function fetchVIX() {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1d';
  const res = await axios.get(url, { timeout: 10000 });
  const meta = res.data.chart.result[0].meta;
  return {
    symbol: 'VIX',
    price: meta.regularMarketPrice,
    previousClose: meta.chartPreviousClose,
    change: meta.regularMarketPrice - meta.chartPreviousClose,
    changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100).toFixed(2),
    updated: new Date().toISOString()
  };
}

// 2. NASDAQ Composite
async function fetchNASDAQ() {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EIXIC?interval=1d&range=1d';
  const res = await axios.get(url, { timeout: 10000 });
  const meta = res.data.chart.result[0].meta;
  return {
    symbol: 'NASDAQ',
    price: meta.regularMarketPrice,
    previousClose: meta.chartPreviousClose,
    change: meta.regularMarketPrice - meta.chartPreviousClose,
    changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100).toFixed(2),
    updated: new Date().toISOString()
  };
}

// 3. S&P 500
async function fetchSP500() {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5ESPX?interval=1d&range=1d';
  const res = await axios.get(url, { timeout: 10000 });
  const meta = res.data.chart.result[0].meta;
  return {
    symbol: 'SP500',
    price: meta.regularMarketPrice,
    previousClose: meta.chartPreviousClose,
    change: meta.regularMarketPrice - meta.chartPreviousClose,
    changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100).toFixed(2),
    updated: new Date().toISOString()
  };
}

// 4. Taiwan Weighted Index (from Yahoo Finance TW)
async function fetchTWSE() {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5ETWII?interval=1d&range=5d';
  const res = await axios.get(url, { timeout: 10000 });
  const meta = res.data.chart.result[0].meta;
  return {
    symbol: 'TWSE',
    name: '台灣加權指數',
    price: meta.regularMarketPrice,
    previousClose: meta.chartPreviousClose,
    change: meta.regularMarketPrice - meta.chartPreviousClose,
    changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100).toFixed(2),
    updated: new Date().toISOString()
  };
}

// 5. Taiwan Futures (TXF) - from Taiwan Futures Exchange
async function fetchTXF() {
  // Try to get from TFEX
  try {
    const url = 'https://www.taifex.com.tw/data/zh/tfxData.json';
    const res = await axios.get(url, { 
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    // TFEX format is different, handle accordingly
    return {
      symbol: 'TXF',
      name: '台指期',
      note: '需要從期交所取得即時行情',
      updated: new Date().toISOString()
    };
  } catch (e) {
    // Fallback: try Yahoo Finance futures
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/TX%3DF?interval=5m&range=1d';
    const res = await axios.get(url, { timeout: 10000 });
    const meta = res.data.chart.result[0].meta;
    return {
      symbol: 'TXF',
      name: '台指期貨',
      price: meta.regularMarketPrice,
      previousClose: meta.chartPreviousClose,
      updated: new Date().toISOString()
    };
  }
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/vix', async (req, res) => {
  try {
    const data = await getWithCache('vix', fetchVIX);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/nasdaq', async (req, res) => {
  try {
    const data = await getWithCache('nasdaq', fetchNASDAQ);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/sp500', async (req, res) => {
  try {
    const data = await getWithCache('sp500', fetchSP500);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/twse', async (req, res) => {
  try {
    const data = await getWithCache('twse', fetchTWSE);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/txf', async (req, res) => {
  try {
    const data = await getWithCache('txf', fetchTXF);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// All markets
app.get('/api/all', async (req, res) => {
  try {
    const [vix, nasdaq, sp500, twse, txf] = await Promise.all([
      getWithCache('vix', fetchVIX),
      getWithCache('nasdaq', fetchNASDAQ),
      getWithCache('sp500', fetchSP500),
      getWithCache('twse', fetchTWSE),
      getWithCache('txf', fetchTXF)
    ]);
    res.json({ vix, nasdaq, sp500, twse, txf, timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Stock API running on port ${PORT}`);
});
