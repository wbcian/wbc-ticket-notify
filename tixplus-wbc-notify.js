"use strict";
require("dotenv").config();
const axios = require("axios");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");

const CONFIG = {
  CHANNEL_ACCESS_TOKEN: process.env.CHANNEL_ACCESS_TOKEN,
  USER_ID: process.env.USER_ID,
  TARGET_URL: "https://tradead.tixplus.jp/wbc2026",
  CHECK_INTERVAL: process.env.CHECK_INTERVAL || "*/5 * * * *",
  MIN_LISTINGS: Number(process.env.MIN_LISTINGS) || 1,
  AXIOS_TIMEOUT: Number(process.env.AXIOS_TIMEOUT) || 15000,
  STATE_FILE: path.join(__dirname, ".notify-state.json"),
};

// === 啟動驗證 ===
if (!CONFIG.CHANNEL_ACCESS_TOKEN || !CONFIG.USER_ID) {
  console.error("❌ 缺少必要設定！");
  console.error("   請先執行 bash setup.sh 或手動建立 .env 檔案。");
  console.error("   需要設定：CHANNEL_ACCESS_TOKEN 和 USER_ID");
  process.exit(1);
}

// === 狀態追蹤 ===
function loadState() {
  try {
    if (fs.existsSync(CONFIG.STATE_FILE)) {
      const raw = fs.readFileSync(CONFIG.STATE_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    console.log("⚠️  狀態檔損壞，將重新建立。");
  }
  return {};
}

function saveState(state) {
  fs.writeFileSync(CONFIG.STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

function filterNewListings(ticketInfoList, state) {
  const newListings = [];
  const newState = {};

  ticketInfoList.forEach((ticket) => {
    const key = ticket.name;
    newState[key] = { listings_count: ticket.listings_count, date: ticket.date };

    const prev = state[key];
    if (!prev || ticket.listings_count > prev.listings_count) {
      newListings.push(ticket);
    }
  });

  return { newListings, newState };
}

// === 主程式 ===
async function checkTicketsAndNotify() {
  const now = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
  console.log(`\n[${now}] 正在檢查票務資訊...`);

  try {
    const response = await axios.get(CONFIG.TARGET_URL, {
      timeout: CONFIG.AXIOS_TIMEOUT,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
      },
    });

    const html = response.data;

    const match = html.match(/data-page="([^"]+)"/);
    const encodedData = match ? match[1] : null;

    if (!encodedData) {
      console.log("未找到 data-page 屬性，可能網頁結構改變或需要登入。");
      return;
    }

    const decoded = encodedData
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
    const data = JSON.parse(decoded);

    const ticketInfoList = extractTicketInfo(data);

    if (ticketInfoList.length === 0) {
      console.log("目前沒有符合門檻的刊登資訊。");
      return;
    }

    // 狀態比對
    const state = loadState();
    const { newListings, newState } = filterNewListings(ticketInfoList, state);
    saveState(newState);

    if (newListings.length === 0) {
      console.log("沒有新的變動，跳過通知。");
      return;
    }

    console.log(`發現 ${newListings.length} 筆新變動，發送通知...`);
    const messageText = formatLineMessage(newListings);
    console.log(messageText);
    await sendLineMessage(messageText);
  } catch (error) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      console.error("⚠️  請求逾時，將在下次排程重試。");
    } else {
      console.error("發生錯誤:", error.message);
    }
  }
}

function extractTicketInfo(jsonData) {
  const results = [];
  const items = jsonData?.props?.concerts || [];

  items.forEach((item) => {
    if (item.listings_count >= CONFIG.MIN_LISTINGS) {
      results.push({
        name: item.name || "未知賽事",
        date: item.concert_date || "未知日期",
        listings_count: item.listings_count || 0,
      });
    }
  });

  return results;
}

async function sendLineMessage(text) {
  const url = "https://api.line.me/v2/bot/message/push";

  const payload = {
    to: CONFIG.USER_ID,
    messages: [
      {
        type: "text",
        text: text,
      },
    ],
  };

  try {
    await axios.post(url, payload, {
      timeout: CONFIG.AXIOS_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CONFIG.CHANNEL_ACCESS_TOKEN}`,
      },
    });

    console.log("LINE 通知發送成功");
  } catch (error) {
    console.error("LINE 發送錯誤:", error.response?.data || error.message);
  }
}

function formatLineMessage(ticketList) {
  let content = `⚾ TIXPLUS 2026WBC 票務快訊 ⚾\n\n`;

  ticketList.forEach((ticket) => {
    content += `🏟 ${ticket.name}\n`;
    content += `📅 賽事日期：${ticket.date}\n`;
    content += `💰 刊登數: ${ticket.listings_count}\n`;
    content += `------------------\n`;
  });

  content += `\n🔗 立即查看:\n${CONFIG.TARGET_URL}`;

  return content;
}

// === 啟動入口 ===
const isOnce = process.argv.includes("--once");

if (isOnce) {
  checkTicketsAndNotify();
} else {
  console.log("🚀 WBC 票務監控已啟動");
  console.log(`   檢查間隔：${CONFIG.CHECK_INTERVAL}`);
  console.log(`   刊登門檻：${CONFIG.MIN_LISTINGS}`);
  console.log("");

  // 啟動時立即跑一次
  checkTicketsAndNotify();

  cron.schedule(CONFIG.CHECK_INTERVAL, () => {
    checkTicketsAndNotify();
  });
}
