const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

const cors = require('cors');
app.use(cors());
app.use(express.json());

const finnhubApiKey = 'cnc3dmhr01qg658c5mi0cnc3dmhr01qg658c5mig';

global.marketOpen = undefined;

const apiKey = 'XseStoj8be8mTASQrO17fWstbo8tn4l0';

const fetchFinnhubData = async (url) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error calling Finnhub API:', error.message);
    throw new Error('Failed to fetch data from Finnhub');
  }
};
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
}


const handleNullValues = data => {
  for (const key in data) {
    if (data[key] === null) {
      data[key] = 0;
    }
  }
  return data;
};

function isMarketOpen(stockTimestamp) {
  const currentTimeUTC = new Date().getTime() / 1000;
  const differenceInSeconds = currentTimeUTC - stockTimestamp;
  return differenceInSeconds < 300;
}

app.get('/api/search/:ticker', async (req, res) => {
  const { ticker } = req.params;

  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);


  const formattedToDate = formatDate(toDate);
  const formattedFromDate = formatDate(fromDate);
  try {

    const profile = await fetchFinnhubData(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${finnhubApiKey}`);

    const quote = await fetchFinnhubData(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${finnhubApiKey}`);

    const peers = await fetchFinnhubData(`https://finnhub.io/api/v1/stock/peers?symbol=${ticker}&token=${finnhubApiKey}`);

    const news = await fetchFinnhubData(`https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${formattedFromDate}&to=${formattedToDate}&token=${finnhubApiKey}`);

    const filteredNews = news.filter(item =>
      item.image && item.url && item.headline && item.datetime
    );
    const limitedNews = filteredNews.slice(0, 20);

    const insidersentiment = await fetchFinnhubData(`https://finnhub.io/api/v1/stock/insider-sentiment?symbol=${ticker}&from=2022-01-01&token=${finnhubApiKey}`);

    const recommendationstrends = await fetchFinnhubData(`https://finnhub.io/api/v1/stock/recommendation?symbol=${ticker}&from=2022-01-01&token=${finnhubApiKey}`);

    const earnings = await fetchFinnhubData(`https://finnhub.io/api/v1/stock/earnings?symbol=${ticker}&from=2022-01-01&token=${finnhubApiKey}`);
    const earnings_nonnull = earnings.map(handleNullValues);

    const aggregatedData = {
      profile,
      quote,
      peers,
      limitedNews,
      insidersentiment,
      earnings_nonnull,
      recommendationstrends

    };

    res.json(aggregatedData);
    global.marketOpen = isMarketOpen(aggregatedData.quote.t);

  } catch (error) {

    res.status(500).send(error.message);
  }
});
app.get('/api/stock/hourly/:ticker', async (req, res) => {

  const { ticker } = req.params;
  try {

    let fromDate = new Date();
    let toDate = new Date();

    if (marketOpen) {
      fromDate.setDate(fromDate.getDate() - 1);
    } else {
      fromDate.setDate(fromDate.getDate() - 2);
      toDate.setDate(toDate.getDate() - 1);
    }

    const fromDateString = formatDate(fromDate);
    const toDateString = formatDate(toDate);

    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker.toUpperCase()}/range/1/hour/${fromDateString}/${toDateString}?adjusted=true&sort=asc&apiKey=${apiKey}`;

    const response = await axios.get(url);
    res.json(response.data.results);
  } catch (error) {
    console.error('Error fetching hourly stock data:', error.message);
    res.status(500).send('Failed to fetch hourly stock data');
  }
});


app.get('/api/historical/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - 6);
  fromDate.setDate(fromDate.getDate() - 2);

  const formattedFromDate = formatDate(fromDate);
  const formattedToDate = formatDate(toDate);

  const url = `https://api.polygon.io/v2/aggs/ticker/${ticker.toUpperCase()}/range/1/day/${formattedFromDate}/${formattedToDate}?adjusted=true&sort=asc&apiKey=${apiKey}`;

  try {
    const response = await axios.get(url);
    res.json(response.data.results);

  } catch (error) {
    console.error('Error fetching historical stock data:', error.message);
    res.status(500).send('Failed to fetch historical stock data');
  }
});

app.get('/api/autocomplete/:query', async (req, res) => {
  const { query } = req.params;
  try {
    const response = await fetchFinnhubData(`https://finnhub.io/api/v1/search?q=${query}&token=${finnhubApiKey}`);

    const filteredResults = response.result
      .filter(item => item.type === 'Common Stock' && !item.symbol.includes('.'));

    res.json(filteredResults);

  } catch (error) {
    console.error('Error fetching autocomplete data:', error.message);
    res.status(500).send('Failed to fetch autocomplete data');
  }
});


// Database
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://yvaghela:Yashvi@hw3.al1pzsy.mongodb.net/?retryWrites=true&w=majority&appName=HW3";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const database = client.db('webtech3');
const portfolio = database.collection('portfolio');
const watchlist = database.collection('watchlist');

app.get('/api/watchlist', async (req, res) => {
  try {
    await client.connect();
    const data = await watchlist.find({}).toArray();
    res.json(data);


  } catch (e) {
    await client.close();
    res.status(500).send({ message: 'Failed to fetch data from watchlist' });
  }
});


app.post('/api/watchlist/add', async (req, res) => {
  try {
    await client.connect();
    const { symbol, companyName } = req.body;

    const exists = await watchlist.findOne({ "stock.Symbol": symbol });
    if (exists) {
      res.status(409).send({ message: 'Stock already in watchlist' });
      return;
    }

    await watchlist.updateOne(
      {},
      { $push: { stock: { Symbol: symbol, CompanyName: companyName } } },
      { upsert: true }
    );
    res.status(200).send({ message: 'Stock added to watchlist' });
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: 'Failed to add stock to watchlist' });
  }
});

app.delete('/api/watchlist/remove/:symbol', async (req, res) => {
  try {
    await client.connect();

    const { symbol } = req.params;

    await watchlist.updateOne(
      {},
      { $pull: { stock: { Symbol: symbol } } }
    );

    res.status(200).send({ message: 'Stock removed from watchlist' });
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: 'Failed to remove stock from watchlist' });
  }
});

app.get('/api/watchlist/contains/:symbol', async (req, res) => {
  try {
    await client.connect();

    const { symbol } = req.params;

    const stockExists = await watchlist.findOne({ "stock.Symbol": symbol });
    res.status(200).send({ isFavorite: !!stockExists });
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: 'Failed to check stock in watchlist', error: e });
  }
});

app.get('/api/portfolio', async (req, res) => {
  try {
    await client.connect();
    const portfolioData = await portfolio.find({}).toArray();
    res.json(portfolioData);
  } catch (e) {
    console.error('Error fetching data from portfolio:', e);
    res.status(500).send({ message: 'Failed to fetch data from portfolio' });
  }
});

app.post('/api/portfolio/buy', async (req, res) => {
  try {
    await client.connect();
    const { symbol, quantity, currentPrice, companyname } = req.body;

    const currentPortfolio = await portfolio.findOne({});
    if (!currentPortfolio) {
      return res.status(404).send({ message: 'Portfolio not found' });
    }
    const stocks = currentPortfolio.stocks || [];
    const stockIndex = stocks.findIndex(stock => stock.Symbol === symbol);

    let updateObject = { $set: {} };
    if (stockIndex !== -1) {

      const currentStock = currentPortfolio.stocks[stockIndex];
      const newQuantity = currentStock.Quantity + quantity;
      const newAvgCost = ((currentStock.BuyingPrice * currentStock.Quantity) + (quantity * currentPrice)) / newQuantity;
      const newBalance = currentPortfolio.Balance - (quantity * currentPrice);
      let updateObject = {
        $set: {}
      };
      updateObject.$set[`stocks.${stockIndex}.Quantity`] = newQuantity;
      updateObject.$set[`stocks.${stockIndex}.BuyingPrice`] = newAvgCost;
      updateObject.$set["Balance"] = newBalance;

      await portfolio.updateOne({ _id: currentPortfolio._id }, updateObject);

      res.json({ message: 'Stock updated successfully' });

    }
    else {
      const newBalance = currentPortfolio.Balance - (quantity * currentPrice);
      updateObject.$push = { stocks: { Symbol: symbol, Quantity: quantity, BuyingPrice: currentPrice, CompanyName: companyname } };
      updateObject.$set["Balance"] = newBalance;
    }

    await portfolio.updateOne({ _id: currentPortfolio._id }, updateObject);
    res.json({ message: 'Transaction successful' });
  } catch (e) {
    console.error('Error updating stock in portfolio:', e);
    res.status(500).send({ message: 'Failed to update stock in portfolio' });
  }
});

app.post('/api/portfolio/sell', async (req, res) => {
  try {
    await client.connect();
    const { symbol, quantity, currentPrice } = req.body;
    const currentPortfolio = await portfolio.findOne({ "stocks.Symbol": symbol });

    if (currentPortfolio) {
      const stockIndex = currentPortfolio.stocks.findIndex(stock => stock.Symbol === symbol);
      if (stockIndex !== -1) {
        const stockQuantity = currentPortfolio.stocks[stockIndex].Quantity;
        if (stockQuantity >= quantity) {
          const newQuantity = stockQuantity - quantity;
          const newBalance = currentPortfolio.Balance + (quantity * currentPrice);
          if (newQuantity > 0) {
            await portfolio.updateOne({ _id: currentPortfolio._id }, {
              $set: {
                [`stocks.${stockIndex}.Quantity`]: newQuantity,
                "Balance": newBalance
              }
            });
          } else {
            await portfolio.updateOne({ _id: currentPortfolio._id }, {
              $pull: { stocks: { Symbol: symbol } },
              $set: { "Balance": newBalance }
            });
          }

          res.json({ message: 'Stock sold successfully' });
        } else {
          res.status(400).send({ message: 'Not enough stock to sell' });
        }
      } else {
        res.status(404).send({ message: 'Stock not found in portfolio' });
      }
    } else {
      res.status(404).send({ message: 'Portfolio not found or does not contain the stock' });
    }
  } catch (e) {
    console.error('Error selling stock:', e);
    res.status(500).send({ message: 'Failed to sell stock' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

