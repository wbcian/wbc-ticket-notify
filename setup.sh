#!/bin/bash
echo "=== WBC Ticket Notify 設定 ==="
echo ""

# 讀取現有 .env
cur_token="" cur_userid="" cur_interval="" cur_min="" cur_timeout=""
if [ -f .env ]; then
  echo "（偵測到現有 .env，直接按 Enter 保留目前值）"
  echo ""
  cur_token=$(grep -m1 '^CHANNEL_ACCESS_TOKEN=' .env | cut -d= -f2-)
  cur_userid=$(grep -m1 '^USER_ID=' .env | cut -d= -f2-)
  cur_interval=$(grep -m1 '^CHECK_INTERVAL=' .env | cut -d= -f2-)
  cur_min=$(grep -m1 '^MIN_LISTINGS=' .env | cut -d= -f2-)
  cur_timeout=$(grep -m1 '^AXIOS_TIMEOUT=' .env | cut -d= -f2-)
fi

# 顯示提示，有舊值時顯示在括號內
prompt_cur() {
  local label="$1" cur="$2"
  if [ -n "$cur" ]; then
    echo "$label [目前: $cur]: "
  else
    echo "$label: "
  fi
}

read -p "$(prompt_cur '請貼上你的 Channel Access Token' "$cur_token")" token
read -p "$(prompt_cur '請貼上你的 User ID (U開頭)' "$cur_userid")" userid

# 沒輸入就沿用舊值
token="${token:-$cur_token}"
userid="${userid:-$cur_userid}"

if [ -z "$token" ] || [ -z "$userid" ]; then
  echo "❌ Channel Access Token 和 User ID 為必填！"
  exit 1
fi

echo ""
echo "--- 以下為選填，直接按 Enter 保留目前值或使用預設值 ---"
echo ""
read -p "$(prompt_cur '檢查間隔 (cron 語法，預設 */5 * * * *)' "$cur_interval")" interval
read -p "$(prompt_cur '刊登數門檻 (預設 1)' "$cur_min")" min_listings
read -p "$(prompt_cur 'HTTP 逾時毫秒數 (預設 15000)' "$cur_timeout")" timeout_ms

interval="${interval:-$cur_interval}"
min_listings="${min_listings:-$cur_min}"
timeout_ms="${timeout_ms:-$cur_timeout}"

# 寫入 .env
echo "CHANNEL_ACCESS_TOKEN=$token" > .env
echo "USER_ID=$userid" >> .env
[ -n "$interval" ] && echo "CHECK_INTERVAL=$interval" >> .env
[ -n "$min_listings" ] && echo "MIN_LISTINGS=$min_listings" >> .env
[ -n "$timeout_ms" ] && echo "AXIOS_TIMEOUT=$timeout_ms" >> .env

echo ""
echo "✅ .env 已建立完成！"
echo ""
echo "現在可以執行："
echo "  npm run check    # 測試一次"
echo "  npm start        # 持續監控（定時檢查）"
