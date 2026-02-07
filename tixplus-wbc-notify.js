"use strict";
require("dotenv").config();
const axios = require("axios");

const CONFIG = {
  CHANNEL_ACCESS_TOKEN: process.env.CHANNEL_ACCESS_TOKEN,
  USER_ID: process.env.USER_ID,
  TARGET_URL: "https://tradead.tixplus.jp/wbc2026",
  CHECK_INTERVAL: "*/5 * * * *",
  NUMBER_OF_REMINDERS: 1,
};

// 主程式
async function checkTicketsAndNotify() {
  try {
    console.log("正在檢查票務資訊...");

    // 1. 抓取網頁內容
    const response = await axios.get(CONFIG.TARGET_URL, {
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

    // 2. 擷取 data-page 屬性
    const match = html.match(/data-page="([^"]+)"/);
    const encodedData = match ? match[1] : null;

    if (!encodedData) {
      console.log("未找到 data-page 屬性，可能網頁結構改變或需要登入。");
      return;
    }

    // 3. 解碼 HTML entities 並轉 JSON
    const decoded = encodedData
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
    const data = JSON.parse(decoded);

    // 4. 解析票務資料
    const ticketInfoList = extractTicketInfo(data);

    if (ticketInfoList.length === 0) {
      console.log("目前沒有刊登資訊。");
      return;
    }

    // 5. 製作 LINE 訊息內容
    const messageText = formatLineMessage(ticketInfoList);
    console.log(messageText);

    // 6. 發送訊息
    await sendLineMessage(messageText);
  } catch (error) {
    console.error("發生錯誤:", error.message);
  }
}

function extractTicketInfo(jsonData) {
  const results = [];
  const items = jsonData?.props?.concerts || [];

  items.forEach((item) => {
    if (item.listings_count >= CONFIG.NUMBER_OF_REMINDERS) {
      results.push({
        name: item.name || "未知賽事",
        date: item.concert_date || "未知日期",
        listings_count: item.listings_count || "詳見官網",
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

// 輔助函式：排版 LINE 訊息
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

// 啟動：單次執行
checkTicketsAndNotify();

// 如需定時執行，改用以下方式（註解上方單次執行）：
// cron.schedule(CONFIG.CHECK_INTERVAL, () => {
//   checkTicketsAndNotify()
// })
// console.log("門票監控腳本已啟動，檢查間隔:", CONFIG.CHECK_INTERVAL)
