# StockSearchWebsite

A website where users can search for any stock and view detailed information including live prices, insights, news, and historical data. It also allows users to simulate buying and selling stocks and keep track of their favorites using a personalized watchlist.


## Tech Stack
- **Frontend:** Angular, TypeScript, Bootstrap  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB  
- **APIs:** Finnhub, Polygon.io  

---

## Setting up project

```bash
# Clone repo
git clone https://github.com/yashvivaghela/StockSearchWebsite.git
cd StockSearchWebsite

# Backend setup
cd server
npm install
npm start

# Frontend setup (in new terminal)
cd ../client/stocksearchapp
npm install
ng serve
