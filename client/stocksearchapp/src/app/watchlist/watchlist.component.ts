import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StockService } from '../stock.service';
import { Router, ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrl: './watchlist.component.css'
})
export class WatchlistComponent implements OnInit {
  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute, private stockService: StockService) { }
  stockData: any = null;
  watchlistData: any[] = [];
  stockPricesMap: { [key: string]: any } = {};
  iswatchlistLoading = true;
  nowatchlistError: boolean = false;
  nowatchlistErrorMessage: string = '';

  ngOnInit() {
    this.getWatchlistData();
  }

  getWatchlistData() {
    this.stockService.getWatchlistData().pipe(
      switchMap((data: any) => {
        this.watchlistData = data;
        console.log('Watchlist Data:', this.watchlistData);
        if (!data || data.length === 0 || data[0].stock.length === 0) {
          this.iswatchlistLoading = false;
          this.nowatchlistError = true;
          this.nowatchlistErrorMessage = 'Currently you dont have any stock in your watchlist.';
          return of([]);
        }
        this.nowatchlistError = false;
        this.nowatchlistErrorMessage = '';
        const symbols = this.watchlistData.flatMap(item =>
          item.stock.map((stock: { Symbol: any; }) => ({ symbol: stock.Symbol, id: item._id }))
        );
        console.log('Symbols:', symbols.map(s => s.symbol));
        return forkJoin(symbols.map(({ symbol }) =>
          this.stockService.getStockData(symbol)
            .pipe(
              map((response: any) => ({ symbol, response }))
            )
        ));
      })
    ).subscribe((responses: any[]) => {
      if (responses.length === 0) {
        this.iswatchlistLoading = false;
        return;
      }
      responses.forEach(({ symbol, response }) => {
        const watchlistItem = this.watchlistData.find(item =>
          item.stock.some((stock: { Symbol: any; }) => stock.Symbol === symbol)
        );
        if (watchlistItem) {
          const stockItem = watchlistItem.stock.find((stock: { Symbol: any; }) => stock.Symbol === symbol);
          if (stockItem) {
            stockItem.quote = response.quote;
          }
        }
      });
      this.iswatchlistLoading = false;
    }, error => {
      this.iswatchlistLoading = false;
      console.error('Error fetching watchlist data:', error);
    });
    complete: () => {
      this.iswatchlistLoading = false;
    }
  }
  deleteStock(symbol: string): void {
    this.stockService.removeStockFromWatchlist(symbol).subscribe({
      next: (response: { message: any; }) => {
        console.log(response.message);
        this.iswatchlistLoading = true;
        this.getWatchlistData();
      },
      error: (error: any) => console.error('Failed to delete stock from watchlist', error)
    });
  }
  navigateToSearch(symbol: string): void {
    this.router.navigate(['/search', symbol]);
  }

}

