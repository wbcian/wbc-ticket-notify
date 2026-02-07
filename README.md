# WBC Ticket Notify

監控日本 [tixplus](https://tradead.tixplus.jp/wbc2026) 上 2026 WBC 票券刊登狀態，有票時透過 LINE 推播通知。

## 事前準備

1. 安裝 [Node.js](https://nodejs.org/)（建議 v18 以上）
2. 建立 LINE 官方帳號並取得 Messaging API 憑證：
   - 前往 [LINE Official Account Manager](https://manager.line.biz/) 建立官方帳號
   - 進入 **設定 → Messaging API** 啟用
   - 到 [LINE Developers Console](https://developers.line.biz/console/) 取得：
     - **Channel Access Token**（Messaging API 頁籤 → Issue）
     - **Your user ID**（Basic settings 頁籤最下方，U 開頭）
   - 用 LINE 掃 QR Code **加自己的 bot 好友**（不加就收不到通知）

## 安裝

```bash
git clone https://github.com/wbcian/wbc-ticket-notify.git
cd wbc-ticket-notify
npm install
```

## 設定

執行 setup script，依提示貼上 Token 和 User ID：

```bash
bash setup.sh
```

或手動建立 `.env` 檔：

```
CHANNEL_ACCESS_TOKEN=你的token
USER_ID=U你的userid
```

## 執行

```bash
node tixplus-wbc-notify.js
```

## 定時執行

編輯 `tixplus-wbc-notify.js` 底部，將單次執行改為 cron 排程：

```js
// 註解掉這行
// checkTicketsAndNotify();

// 打開這段（預設每 5 分鐘檢查一次）
cron.schedule(CONFIG.CHECK_INTERVAL, () => {
  checkTicketsAndNotify();
});
```

## 致謝

Fork from [yhl/tixplus-wbc-notify](https://github.com/yhl/tixplus-wbc-notify)
