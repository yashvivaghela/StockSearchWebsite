import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = 'http://localhost:3000/api';
  // private apiUrl = 'https://hw3app-pw2qwsxmcq-wl.a.run.app/api';

  constructor(private http: HttpClient) { }


  getAutocompleteSuggestions(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/autocomplete/${query}`);
  }

  getStockData(ticker: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search/${ticker}`);
  }
  getHourlyStockData(ticker: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/stock/hourly/${ticker}`);
  }

  getHistoricalData(ticker: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/historical/${ticker}`);
  }
  getWatchlistData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/watchlist`);
  }
  addStockToWatchlist(symbol: string, companyName: string): Observable<any> {
    const body = { symbol, companyName };
    return this.http.post(`${this.apiUrl}/watchlist/add`, body);
  }
  removeStockFromWatchlist(symbol: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/watchlist/remove/${symbol}`);
  }

  checkStockInWatchlist(symbol: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/watchlist/contains/${symbol}`);
  }

  getPortfolioData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/portfolio`);
  }

  buyStock(purchaseDetails: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/portfolio/buy`, purchaseDetails);
  }
  sellStock(sellData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/portfolio/sell`, sellData);
  }

}



