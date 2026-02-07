#!/bin/bash
echo "=== WBC Ticket Notify 設定 ==="
echo ""
read -p "請貼上你的 Channel Access Token: " token
read -p "請貼上你的 User ID (U開頭): " userid
echo ""

echo "CHANNEL_ACCESS_TOKEN=$token" > .env
echo "USER_ID=$userid" >> .env

echo "✅ .env 已建立完成！"
echo ""
echo "現在可以執行："
echo "  node tixplus-wbc-notify.js"
