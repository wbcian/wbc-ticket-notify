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

或手動建立 `.env` 檔（參考 `.env.example`）。

想修改設定？再跑一次 `bash setup.sh` 即可，會顯示目前的值，直接按 Enter 保留不變。

## 執行

```bash
# 測試一次（確認設定正確，跑完自動結束）
npm run check

# 持續監控（預設每 5 分鐘檢查一次，按 Ctrl+C 停止）
npm start
```

建議先用 `npm run check` 確認能正常收到 LINE 通知，再用 `npm start` 長期監控。

> 想了解腳本內部運作細節，請參考 [HOW-IT-WORKS.md](./HOW-IT-WORKS.md)。

## 進階設定

在 `.env` 中可調整以下選項（不填則使用預設值）：

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `CHECK_INTERVAL` | 檢查間隔（cron 語法） | `*/5 * * * *` |
| `MIN_LISTINGS` | 刊登數門檻，低於此數不通知 | `1` |
| `AXIOS_TIMEOUT` | HTTP 請求逾時（毫秒） | `15000` |

## 狀態追蹤

腳本會自動建立 `.notify-state.json` 記錄已通知過的賽事狀態，避免重複發送相同通知。刪除此檔可重置狀態。

## 致謝

Fork from [yhl/tixplus-wbc-notify](https://github.com/yhl/tixplus-wbc-notify)
