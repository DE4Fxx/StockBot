import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';
import { ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,} from "discord.js";
// Symbols for aesthetics

export const SYMBOLS = {
  prefix: '$',
  check: '✅',
  cross: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  spark: '✨'

}

// Shared browser for reusability

let sharedBrowser =  await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage","--disable-setuid-sandbox"],
    })


// Flags for messages

export const FLAGS = {
  ephemeral : 1 << 6
}

// Gets the entire server's channel IDs

export async function getChannelIDs(guild) {
  await guild.channels.fetch();
  return guild.channels.cache.map(channel => {
    return {
      name: channel.name,
      id: channel.id
    };
  });
}

// Helper function for stringifying numbers

export async function stringifyNumber(num, round_up = false, shorten = false) 
{
  console.log(num);
  if (!isNaN(num)) {
    const number = Number(num);

    if (shorten) {
      if (number >= 1e12) return (number / 1e12).toFixed(2) + 'T';
      if (number >= 1e9) return (number / 1e9).toFixed(2) + 'B';
      if (number >= 1e6) return (number / 1e6).toFixed(2) + 'M';
      if (number >= 1e3) return (number / 1e3).toFixed(2) + 'K';
    }

    if (round_up) {
      return number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    return number.toLocaleString("en-US");
  }

  return num + " is not a number...";
}

// Logs denied command executions

export function logDenied(user, reason,command) 
{
    
  const line = `\n[DENIED] ${new Date().toISOString()} | ${user.tag} (${user.id}) tried to execute $${command}: ${reason}\n`;
  const logPath = path.join('logs', 'purge-log.txt');
  fs.appendFileSync(logPath, line);
}

// Logs messages

export async function logMessages(message){
     const logHeader = `\n\n=== Message by ${message.author.tag} (${message.author.id}) at ${new Date().toISOString()}: ${message.content} ===\n`;
     const logPath = path.join('logs', 'message-log.txt');
     // Append log to file
     fs.appendFileSync(logPath, logHeader);
}

// Searches a subreddit for information about a specific ticker

export async function searchSubeddit(sub,ticker){
  ticker = ticker.toUpperCase();
  const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=new&t=week`
  const response = await fetch(url);
  const data = await response.json();

  return data.data.children.map(post => ({
      subreddit: sub,
      title: post.data.title,
      url:`https://reddit.com${post.data.permalink}`,
      flair: post.data.link_flair_text,
      created: new Date(post.data.created_utc * 1000).toLocaleString()    
  }))
}

// Scrapes any page from the web

export async function scrapeWeb(url){
    const browser = await puppeteer.launch({
    headless: true,             
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  // Set HTTP header UA
  await page.setExtraHTTPHeaders({
    "User-Agent": UA,
  });

  // Force navigator.userAgent inside JS context
  await page.evaluateOnNewDocument(ua => {
    Object.defineProperty(navigator, "userAgent", {
      get: () => ua,
    });
  }, UA);



  await page.goto(url, { waitUntil: "networkidle2" });
  

  await browser.close();

  return html;

}


// Optimized scraper with specific selectors, also takes in a map function that parses stuff into a json object

export async function scrapeWithSelector(url, selector, mapFn, opts = {}) {


  const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  const {
    timeout = 30000,        // how long to wait for selector / navigation
    blockMedia = true,      // disable images/fonts/css/etc
    waitUntil = "domcontentloaded",
  } = opts;

  // Reuse browser for future implementation
  const browser =
    sharedBrowser ??
    (sharedBrowser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    }));

  const page = await browser.newPage();

  try {
    // Headers + navigator.userAgent
    await page.setExtraHTTPHeaders({ "User-Agent": UA });

    await page.evaluateOnNewDocument(ua => {
      Object.defineProperty(navigator, "userAgent", {
        get: () => ua,
      });
    }, UA);

    // Block heavy resources
    if (blockMedia) {
      await page.setRequestInterception(true);
      page.on("request", req => {
        const type = req.resourceType();
        if (["image", "font", "stylesheet", "media"].includes(type)) {
          req.abort();
        } else {
          req.continue();
        }
      });
    }

    await page.goto(url, { waitUntil, timeout });

    await page.waitForSelector(selector, {
      timeout,
      visible: true,
    });

    const result = await page.$$eval(selector, mapFn);
    return result;
  } finally {
    // Close only the page; keep browser around for reuse
    await page.close().catch(() => {});
  }
}

// Searches the bot's stored subreddits for information about a ticker

export async function searchReddit(ticker){
  const responseData = {};
  const data = fs.readFileSync('/usr/src/stockbot/src/subreddits.json','utf-8');
  const subs = JSON.parse(data);
  for(const sub of subs){
    const redditData = await searchSubeddit(sub,ticker);
    responseData[sub] = redditData;
  }
  
  return responseData;
}

// Embed paginator

export async function paginateEmbeds(ctx, channel, embeds, {
  pageSize = 5,
  timeout = 600000, // 10 min
} = {}) {

  // Split into pages of size pageSize
  const pages = [];
  for (let i = 0; i < embeds.length; i += pageSize) {
    pages.push(embeds.slice(i, i + pageSize));
  }

  if (pages.length === 0) {
    return ctx.reply({
      content: "No results found.",
      ephemeral: true,
    });
  }

  let page = 0;

  // Create action row dynamically
  const makeRow = (pageIndex) =>
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("Prev")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pageIndex === 0),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pageIndex === pages.length - 1),
      new ButtonBuilder()
        .setCustomId("stop")
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger)
    );

  // Send first page
  const message = await channel.send({
    content: `Requested by <@${ctx.user.id}>`,  // This pings the user
    embeds: pages[0],
    components: [makeRow(0)],
    fetchReply: true,
  });

  const collector = message.createMessageComponentCollector({
    time: timeout,
    filter: (i) => i.user.id === (ctx.user?.id ?? ctx.author.id),
  });

  collector.on("collect", async (i) => {
    if (i.customId === "prev") {
      if (page > 0) page--;
    } else if (i.customId === "next") {
      if (page < pages.length - 1) page++;
    } else if (i.customId === "stop") {
      collector.stop("closed");
      return i.update({ components: [] }); // remove buttons
    }

    await i.update({
      embeds: pages[page],
      components: [makeRow(page)],
    });
  });

  collector.on("end", async () => {
    try {
      await message.edit({ components: [] });
    } catch (_) {}
  });
}


// Helper functions for date conversion to UNIX and back

export async function toUnix(dateStr){
  return Math.floor(new Date(dateStr).getTime()/1000);
}

export async function fromUnix(unixTimestamp){
  const date = new Date(unixTimestamp*1000);
  return date.toISOString().split('T')[0];
}






