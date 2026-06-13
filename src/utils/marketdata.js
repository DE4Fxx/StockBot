import { setCache } from "../../cache/cache.js";
import {scrapeWithSelector} from "./functions.js";

// Retrieves detailed information about a company

export async function detailThis(stock,user)
{
  const apiKey = process.env.FMP_API_KEY;
  const finnhubApiKey = process.env.FINNHUB_API_KEY;

  // Dictionary to store all the URLs

  const urls = {
      profile: `https://financialmodelingprep.com/api/v3/profile/${stock}?apikey=${apiKey}`,
      incomeStatement: `https://financialmodelingprep.com/api/v3/income-statement/${stock}?limit=1&apikey=${apiKey}`,
      balanceSheet: `https://financialmodelingprep.com/api/v3/balance-sheet-statement/${stock}?limit=1&apikey=${apiKey}`,
      dividends: `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${stock}?apikey=${apiKey}`,
      analystStatements: `https://finnhub.io/api/v1/stock/recommendation?symbol=${stock}&token=${finnhubApiKey}`,
      quarterlyEarnings: `https://finnhub.io/api/v1/stock/earnings?symbol=${stock}&token=${finnhubApiKey}`

      //For later if I ever upgrade to FMP premium $50 per month plan

      // quarterlyEarnings: `https://financialmodelingprep.com/api/v3/earning_calendar?symbol=${stock}&limit=1&apikey=${apiKey}`,
      // analystRatings: `https://financialmodelingprep.com/api/v3/analyst-estimates/${stock}?apikey=${apiKey}`
    };

    try {

      // Batches all the endpoints so that they are run as one API call
        
      const entries = await Promise.all(
        Object.entries(urls).map(([key, url]) =>
          fetch(url).then(res => res.json()).then(data => [key, data])
        )
      );

      // Cache data for later

      const responses = Object.fromEntries(entries);
      // Logs the user that executed
      responses.userExecuted = user

      await setCache(stock+":INFO",JSON.stringify(responses))
      return responses;
  }
    catch(err){
      console.error("Error fetching info",err);
    }

}

export async function getDividendData(symbol, apiKey) 
{
  if(!apiKey)
    apiKey = process.env.FMP_API_KEY
  const url = `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${symbol}?apikey=${apiKey}`;

  const res = await fetch(url);
  const json = await res.json();
  const history = json?.historical || [];

  if (history.length < 1) {
    console.log("No dividend data");
    return;
  }

  // Sort by date (newest first)
  const sorted = history.sort((a, b) => new Date(b.date) - new Date(a.date));
  const mostRecent = sorted[0];

  // Get frequency
  const gaps = [];
  const divisor = (1000 * 60 * 60 * 24); // For converting milliseconds to days
  for (let i = 1; i < sorted.length; i++) {
    const gap = (new Date(sorted[i - 1].date) - new Date(sorted[i].date)) / divisor;
    gaps.push(gap);
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  let frequency = 'unknown';
  if (avgGap > 80 && avgGap < 100) frequency = 'quarterly';
  else if (avgGap > 25 && avgGap < 35) frequency = 'monthly';
  else if (avgGap > 350 && avgGap < 380) frequency = 'annual';
  else frequency = 'irregular';

  // Fetch current stock price
  const quoteRes = await fetch(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`);
  const quoteJson = await quoteRes.json();
  const price = quoteJson?.[0]?.price || null;

  const yieldPercent = price
    ? ((mostRecent.dividend / price) * 100).toFixed(2)
    : "N/A";

  console.log(`Most recent dividend for ${symbol}: $${mostRecent.dividend} on ${mostRecent.date}`);
  console.log(`Estimated dividend frequency: ${frequency}`);
  console.log(`Estimated dividend yield: ${yieldPercent}%`);
  return [mostRecent.dividend, frequency];
}



// Gets ticker data

export async function getTickerData(symbol)
{
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`);
  const data = await res.json();
  await setCache(symbol+":NEWS",data);

  console.log(data);

  // For future modification, who knows
  const { c: current, pc: prevClose, d: absolute, dp: dailyPercent, h: high, l: low, o: open, pc: previousClose, t: timestamp } = data;
  console.log(data);
  return data;
}


// Constructs a summary of a specified stock (Doesn't work, needs refining)

export async function getQuoteData(symbol) 
{
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`);
  const data = await res.json();
  await setCache(symbol+":NEWS",data);

  console.log(data);


  const { c: current, pc: prevClose, d: absolute, dp: dailyPercent, h: high, l: low, o: open, t: timestamp } = data;
  let unixTime = Date.now()
  return `📊 ${symbol} Quote:
  - Current: $${(current)}
  - Previous Close: $${prevClose}
  - Daily % Change: ${dailyPercent}%
  - Daily Absolute Change: $${absolute}
  - Highest Price: $${high}
  - Lowest Price: $${low}
  - Price At Market Open: $${open}
  - Date: ${new Date(unixTime * 1000).toLocaleString()}`;
}

// Retrieves published articles about a stock over a time period and caches it in a SQL database

export async function retrieveNews(stock,from,to)
{
    const apiKey = process.env.FINNHUB_API_KEY;
    try{
        const url = `https://finnhub.io/api/v1/company-news?symbol=${stock}&from=${from}&to=${to}&token=${apiKey}`;
        let response = await fetch(url);
        response = await response.json();
        await setCache(stock+":NEWS",response);
        if(!response){
          console.log("Nothing retrieved");
        }
        return response;

    }
    catch (err){
        console.error('❌ Failed to retrieve published articles')
    }

}

// Scrapes splits from any url with a table

export async function getSplits (url){

  const splits = await scrapeWithSelector(
    url,
    "table tbody tr",
    rows =>
      rows.map(row => {
        const cells = Array.from(row.querySelectorAll("td"));
        return {
          date: cells[0]?.innerText.trim(),
          company: cells[1]?.innerText.trim(),
          companyFullName: cells[2]?.innerText.trim(),
          splitType: cells[3]?.innerText.trim(),
          payout: cells[4]?.innerText.trim(),
        };
      })
  );
  return splits
}


// Stores splits in a database 

export async function retrieveUpcomingSplitsFromTipRanks(url)
{
  console.log(url)
  const splits = await getSplits(url);
  splits.forEach((obj) => {
    const date = new Date(obj.date);
    setCache(obj.company + ":SPLIT" + `(${date.getMonth()}/${date.getFullYear()})` ,obj);
  })
}

export async function getCompanyName(ticker) {
  try {
    const result = await yahooFinance.quoteSummary(ticker, { modules: ['price'] });
    return result.price.longName; // e.g. "Apple Inc."
  } catch (err) {
    console.error("Error fetching company:", err);
    return null;
  }
}
