# Stock API 部署指南

## 本地測試

```bash
cd stock-api
npm install
npm start
```

測試：
- http://localhost:3000/api/all
- http://localhost:3000/api/vix
- http://localhost:3000/api/nasdaq

---

## 部署到 Zeabur

### 方法 1: Git 部署（推薦）

1. **推送代碼到 GitHub**
```bash
cd stock-api
git init
git add .
git commit -m "Add stock API"
# 推送到你的 GitHub
```

2. **Zeabur 操作**
   - 登入 [zeabur.com](https://zeabur.com)
   - New Project → 從 GitHub 選擇專案
   - 選擇 branch，Deploy

3. **環境變數**（可選）
   - PORT: 3000（Zeabur 會自動設定）

### 方法 2: zeabur-cli 部署

```bash
npm i -g zeabur
zeabur login
zeabur deploy
```

---

## API 端點

| 端點 | 說明 |
|------|------|
| `/api/all` | 全部市場數據 |
| `/api/vix` | VIX 恐慌指數 |
| `/api/nasdaq` | NASDAQ |
| `/api/sp500` | S&P 500 |
| `/api/twse` | 台灣加權 |
| `/api/txf` | 台指期貨 |

---

## 取得 API URL

部署完成後會得到一個 URL，例如：
`https://stock-api-xxx.zeabur.app`

然後更新 heartbeat 監控指向這個 API。
