# StockSearchWebsite

A website where users can search for any stock and view detailed information including live prices, insights, news, and historical data. It also allows users to simulate buying and selling stocks and keep track of their favorites using a personalized watchlist.

## Demo
* Users can search for any stock by its ticker symbol. Autocomplete suggestions appear dynamically using data from the Finnhub API.

<img width="1469" height="796" alt="Screenshot 2025-10-18 at 1 04 16 PM" src="https://github.com/user-attachments/assets/d64a72c0-3488-4c91-81dd-e529d7ea33ea" />

<br>

* Displays detailed company information including live price, market status. Tabs provide quick access to Summary, Top News, Charts, and Insights.
  
<img width="1470" height="798" alt="Screenshot 2025-10-18 at 1 04 40 PM" src="https://github.com/user-attachments/assets/36258ded-f7d2-4668-b02b-7d397964b629" />

<br>

 * Interactive historical charts visualize stock performance over different time ranges (1m–1y). Users can zoom, scroll, and analyze price variations and trading volumes.
   
<img width="1470" height="795" alt="Screenshot 2025-10-18 at 1 05 07 PM" src="https://github.com/user-attachments/assets/b38ffe33-5ac2-43ec-a38a-03634b3140e7" />

<br>

* Users can simulate buying/selling stocks at real-time prices.
  
<img width="1470" height="796" alt="Screenshot 2025-10-18 at 1 05 25 PM" src="https://github.com/user-attachments/assets/aa63c7ad-4f5c-4fa5-a5be-66ff9dec6bfb" />

<br>

* After completing a transaction, the app confirms the purchase with a success banner and updates the portfolio instantly.
  
<img width="1470" height="796" alt="Screenshot 2025-10-18 at 1 07 19 PM" src="https://github.com/user-attachments/assets/89435628-3908-4fa2-aa75-38d55b5a2051" />

<br>

* Users can add or remove a stock from their Watchlist by simply toggling the ⭐ icon on the company name.
  
<img width="1470" height="829" alt="Screenshot 2025-10-18 at 1 34 41 PM" src="https://github.com/user-attachments/assets/525990bc-5f1c-4a81-ab8f-1083173565e6" />

<br>

* A personalized Watchlist where users can monitor their favorite stocks and remove them anytime.
  
<img width="1470" height="795" alt="Screenshot 2025-10-18 at 1 15 23 PM" src="https://github.com/user-attachments/assets/d70eca1c-966e-4aec-95a9-0fb5fef36bd1" />

<br>

* Displays all owned stocks with real-time prices, total cost, market value, and gain/loss indicators. Users can also simulate selling shares directly from this view.
  
<img width="1470" height="794" alt="Screenshot 2025-10-18 at 1 15 44 PM" src="https://github.com/user-attachments/assets/38822f90-9c3d-40e8-831b-1015f8dd07df" />

<br>

* Allows users to buy/sell shares from their portfolio.
  
<img width="1470" height="794" alt="Screenshot 2025-10-18 at 1 15 56 PM" src="https://github.com/user-attachments/assets/1ea6066f-610c-4f29-92d6-b39966644604" />

<br>

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
