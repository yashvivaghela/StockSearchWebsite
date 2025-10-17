import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { StockService } from '../stock.service';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css'
})
export class PortfolioComponent implements OnInit {
  buyquantity: number = 0;
  sellquantity: number = 0;
  portfolioData: any[] = [];
  isportfolioLoading = true;

  selectedBuyItem: any;
  buyalert: boolean = false;
  buyalertMessage: string = '';

  sellalert: boolean = false;
  sellalertMessage: string = '';
  portfolioEmpty: boolean = false;
  portfolioEmptyMessage: string = '';
  constructor(private http: HttpClient, private router: Router, private stockService: StockService, private modalService: NgbModal) { }

  ngOnInit() {
    this.getPortfolioData();
  }

  getPortfolioData() {

    this.stockService.getPortfolioData().pipe(
      switchMap((data: any) => {
        this.isportfolioLoading = true;
        this.portfolioData = data;

        if (this.portfolioData.length === 0 || this.portfolioData.every(item => item.stocks.length === 0)) {
          this.isportfolioLoading = false;
          this.portfolioEmpty = true;
          this.portfolioEmptyMessage = `Currently, you dont have any stocks`;
          return of([]);
        }
        const symbols = this.portfolioData.flatMap(item =>
          item.stocks.map((stocks: { Symbol: any; }) => ({ symbol: stocks.Symbol, id: item._id }))
        );
        console.log('Symbols:', symbols);
        return forkJoin(symbols.map(({ symbol }) =>
          this.stockService.getStockData(symbol)
            .pipe(
              map((response: any) => ({ symbol, response }))
            )
        ));
      })
    ).subscribe((responses: any[]) => {
      responses.forEach(({ symbol, response }) => {
        const portfolioItem = this.portfolioData.find(item =>
          item.stocks.some((stocks: { Symbol: any; }) => stocks.Symbol === symbol)
        );
        if (portfolioItem) {
          const stockItem = portfolioItem.stocks.find((stocks: { Symbol: any; }) => stocks.Symbol === symbol);
          if (stockItem) {
            stockItem.quote = response.quote.c;
          }
        }
      });

      this.isportfolioLoading = false;
    }, error => {
      this.isportfolioLoading = false;
      console.error('Error fetching portfolio data:', error);
    });
    complete: () => {
      this.isportfolioLoading = false;
    }
  }
  navigateToSearch(symbol: string): void {
    this.router.navigate(['/search', symbol]);
  }
  selectbuysellitems(stock: any, content: any): void {
    this.selectedBuyItem = stock;
    this.modalService.open(content, { size: 'md' });
  }

  buyStock(symbol: string, modal: any) {
    const portfolioStock = this.portfolioData[0]?.stocks.find((s: { Symbol: string; }) => s.Symbol === symbol);

    if (this.buyquantity > 0 && this.buyquantity * portfolioStock.quote <= this.portfolioData[0]?.Balance) {
      const buyData = {
        symbol: symbol,
        quantity: this.buyquantity,
        currentPrice: portfolioStock.quote,

      };
      console.log(buyData)
      this.stockService.buyStock(buyData).subscribe({
        next: (response) => {
          console.log('Stock purchased successfully', response);
          this.getPortfolioData()
          this.buyalert = true;
          this.buyalertMessage = `${symbol} bought successfully`;
          setTimeout(() => this.buyalert = false, 5000);
          this.buyquantity = 0;
          modal.dismiss();

        },
        error: (error) => {
          console.error('Error purchasing stock', error);
        }
      });
    }
  }

  sellStock(symbol: string, modal: any) {
    const portfolioStock = this.portfolioData[0]?.stocks.find((s: { Symbol: string; }) => s.Symbol === symbol);

    if (portfolioStock && this.sellquantity > 0 && this.sellquantity <= portfolioStock.Quantity) {
      const sellData = {
        symbol: symbol,
        quantity: this.sellquantity,
        currentPrice: portfolioStock.quote,
      };

      console.log(sellData);
      this.stockService.sellStock(sellData).subscribe({
        next: (response) => {
          console.log('Stock sold successfully', response);
          this.getPortfolioData()
          this.sellalert = true;
          this.sellalertMessage = `${symbol} sold successfully`;
          setTimeout(() => this.sellalert = false, 5000);
          this.sellquantity = 0;
          modal.dismiss();
        },
        error: (error) => {
          console.error('Error selling stock', error);
        }
      });
    } else {
      console.log('Cannot sell stock due to insufficient quantity or other issue');
    }
  }

}