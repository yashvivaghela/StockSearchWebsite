import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { StockService } from '../stock.service';
import { startWith, debounceTime, switchMap, map, takeUntil, delay } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, Subject, interval } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import * as Highcharts from 'highcharts/highstock';
import 'highcharts/indicators/indicators';
import 'highcharts/indicators/volume-by-price';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit {

  searchControl = new FormControl('');
  selectedTicker: string | null = null;
  stockData: any = null;
  errorMessage: string = '';
  filteredOptions!: Observable<any[]>;
  currentTimestamp: Date = new Date();
  // currentTime = new Date().getTime() / 1000;
  marketIsOpen: boolean = false;
  selectedNewsItem: any;

  totalMspr: number = 0;
  positiveMspr: number = 0;
  negativeMspr: number = 0;
  totalChange: number = 0;
  positiveChange: number = 0;
  negativeChange: number = 0;
  recommendationOptions: any;
  earningsOptions: any;
  summarychartOptions: any;
  chartsOption: any;
  Highcharts: typeof Highcharts = Highcharts;

  noDataError: boolean = false;
  noDataErrorMessage: string = '';
  searchAttempted: boolean = false;

  isLoading = false;
  isStockDataLoading = false;

  watchlistaddError: boolean = false;
  watchlistaddErrorMessage: string = '';

  watchlistdeleteError: boolean = false;
  watchlistdeleteErrorMessage: string = '';

  portfolioData: any[] = [];
  buyquantity: number = 0;
  sellquantity: number = 0;
  buyalert: boolean = false;
  buyalertMessage: string = '';

  sellalert: boolean = false;
  sellalertMessage: string = '';

  stockInPortfolio: boolean = false;

  currentStockQuantity: number = 0;

  private unsubscribe$ = new Subject<void>();
  selectedBuyItem: any;
  t:any;
  dataFetchSubscription: any;

  constructor(
    private stockService: StockService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private http: HttpClient,
  ) { }


  ngOnInit(): void {
    
    this.filteredOptions = this.searchControl.valueChanges.pipe(
      debounceTime(50),
      startWith(''),
      switchMap(value => {
        if (value) {
          this.isLoading = true;
          return this.stockService.getAutocompleteSuggestions(value).pipe(
            map(data => {
              this.isLoading = false;
              return data;
            }),
            startWith([])
          );
        } else {
          this.isLoading = false;
          return of([]);
        }
      })
    );

    this.route.params.pipe(
      switchMap(params => {
        const ticker = params['ticker'];
        this.t=ticker
        if (ticker) {
          this.isStockDataLoading = true;
          this.searchControl.setValue(ticker, { emitEvent: false });
          this.searchAttempted = false;
          this.fetchdata(ticker);
          this.loadHourlyStockData(ticker);
          this.loadChartData(ticker);
          this.getPortfolio(ticker);
          return this.stockService.getStockData(ticker);

        } else {
          return [];
        }
        
      })
      
    )

    .subscribe(data => {
      this.isStockDataLoading = false;
      if (!data || !data.profile || Object.keys(data.profile).length === 0) {
        this.noDataError = true;
        this.noDataErrorMessage = 'No data found. Please enter a valid ticker symbol.';
        this.stockData = null;
      } else {
        this.noDataError = false;
        this.stockData = data;
        const recommendationData = data.recommendationstrends;
        this.recommendationcharts(recommendationData)
        this.earningschart(data.earnings_nonnull);
        this.aggregateInsiderSentiments(data.insidersentiment.data);
        this.marketIsOpen = this.isMarketOpen(data.quote.t);
        console.log("rrrrr",data.quote.t)
        console.log(this.marketIsOpen)
        this.checkIfFavorite(data.profile.ticker);
        this.errorMessage = '';
      }
    }, error => {
      this.isStockDataLoading = false;
      console.error('Error fetching stock data:', error);
      this.noDataError = true;
      this.noDataErrorMessage = error.message || 'Failed to fetch data. Please try again.';
      this.stockData = null;
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  isMarketOpen(stockTimestamp: number): boolean {
    const differenceInSeconds = (this.currentTimestamp.getTime() - (stockTimestamp * 1000)) / 1000;
    return differenceInSeconds < 300;
  }

  fetchdata(ticker: string | undefined){

    interval(15000).pipe(
      takeUntil(this.unsubscribe$),
      switchMap(() => ticker ? this.stockService.getStockData(ticker) : of(null))
    ).subscribe(data => {
      if (data) {
        this.stockData = data;
        this.currentTimestamp = new Date();
      }
    }, error => {
      console.error('Failed to fetch stock data:', error);
    });
  }

//   fetchdata(ticker: string | undefined){
//     // Unsubscribe from the previous subscription if it exists
//     if (this.dataFetchSubscription) {
//         this.dataFetchSubscription.unsubscribe();
//         this.dataFetchSubscription = null;
//     }

//     // Create a new interval subscription with the updated ticker
//     this.dataFetchSubscription = interval(15000).pipe(
//         takeUntil(this.unsubscribe$),
//         switchMap(() => ticker ? this.stockService.getStockData(ticker) : of(null))
//     ).subscribe(data => {
//         if (data) {
//             this.stockData = data;
//             this.currentTimestamp = new Date();
//         }
//     }, error => {
//         console.error('Failed to fetch stock data:', error);
//     });
// }

// ngOnDestroy(): void {
//   this.unsubscribe$.next();
//   this.unsubscribe$.complete();
//   if (this.dataFetchSubscription) {
//       this.dataFetchSubscription.unsubscribe();
//   }
// }

  aggregateInsiderSentiments(data: any[]): void {

    this.totalMspr = data.reduce((sum, record) => {
      const msprValue = parseFloat(record.mspr);
      return sum + (isNaN(msprValue) ? 0 : msprValue);
    }, 0);

    this.positiveMspr = data.reduce((sum, record) => {
      const msprValue = parseFloat(record.mspr);
      return msprValue > 0 ? sum + msprValue : sum;
    }, 0);

    this.negativeMspr = data.reduce((sum, record) => {
      const msprValue = parseFloat(record.mspr);
      return msprValue < 0 ? sum + msprValue : sum;
    }, 0);

    this.totalChange = data.reduce((sum, record) => {
      const changeValue = parseFloat(record.change);
      return sum + (isNaN(changeValue) ? 0 : changeValue);
    }, 0);

    this.positiveChange = data.reduce((sum, record) => {
      const changeValue = parseFloat(record.change);
      return changeValue > 0 ? sum + changeValue : sum;
    }, 0);

    this.negativeChange = data.reduce((sum, record) => {
      const changeValue = parseFloat(record.change);
      return changeValue < 0 ? sum + changeValue : sum;
    }, 0);


  }

  recommendationcharts(recommendationData: any[]) {
    const strongBuySeries = recommendationData.map(item => item.strongBuy);
    const buySeries = recommendationData.map(item => item.buy);
    const holdSeries = recommendationData.map(item => item.hold);
    const sellSeries = recommendationData.map(item => item.sell);
    const strongSellSeries = recommendationData.map(item => item.strongSell);

    const categories = recommendationData.map(item => item.period);

    this.recommendationOptions = {
      chart: {
        type: 'column',
        backgroundColor: '#F4F4F4'
      },
      title: {
        text: 'Recommendation Trends',
      },
      xAxis: {
        categories: categories
      },
      yAxis: {
        min: 0,
        title: {
          text: '# Analysis'
        },
        stackLabels: {
          enabled: true
        }
      },
      tooltip: {
        headerFormat: '<b>{point.x}</b><br/>',
        pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
      },

      plotOptions: {
        column: {
          stacking: 'normal',
          dataLabels: {
            enabled: true,
          }
        }
      },
      series: [{
        name: 'Strong Buy',
        data: strongBuySeries,
        color: '#175327'
      }, {
        name: 'Buy',
        data: buySeries,
        color: '#24A340'
      }, {
        name: 'Hold',
        data: holdSeries,
        color: '#A06B1F'
      }, {
        name: 'Sell',
        data: sellSeries,
        color: '#EC434D'
      }, {
        name: 'Strong Sell',
        data: strongSellSeries,
        color: '#601E21'
      }]
    };
  }

  earningschart(earningsData: any[]): void {

    const estimateData = earningsData?.map(data => ({
      x: Date.parse(data.period),
      y: data.estimate !== null ? data.estimate : 0,
      surprise: data.surprise !== null ? data.surprise : 0,
      marker: {
        symbol: 'diamond'
      }
    }));

    const actualData = earningsData?.map(data => ({
      x: Date.parse(data.period),
      y: data.actual !== null ? data.actual : 0,
      surprise: data.surprise !== null ? data.surprise : 0,
      marker: {
        symbol: 'circle'
      }
    }));

    this.earningsOptions = {
      chart: {
        type: 'spline',
        backgroundColor: '#F4F4F4'
      },
      title: {
        text: 'Historical EPS Surprises',
      },
      xAxis: {
        type: 'datetime',

      },
      yAxis: {
        title: {
          text: 'Quarterly EPS'
        }
      },
      tooltip: {
        pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y}</b><br/>'

      },
      plotOptions: {
        spline: {
          marker: {
            enabled: true
          }
        }
      },
      series: [{
        name: 'Actual',
        data: actualData,
        color: '#2595F8'
      }, {
        name: 'Estimate',
        data: estimateData,
        color: '#3A34AC'
      }]
    };
  }


  fetchStockData(ticker: string): void {
    this.stockService.getStockData(ticker).subscribe(data => {
      this.stockData = data;
      this.errorMessage = '';
    }, error => {
      console.error('Error fetching stock data:', error);
      this.errorMessage = 'Failed to fetch data. Please try again.';
      this.stockData = null;
    });

  }

  loadHourlyStockData(ticker: string): void {
    this.stockService.getHourlyStockData(ticker).subscribe(data => {
      const chartData = data.map((item: any) => {
        return [
          item.t,
          item.c
        ];
      });
      this.summarychartfunction(chartData, ticker, this.marketIsOpen);
    }, error => {
      console.error('Error fetching hourly stock data:', error);
    });
  }
  summarychartfunction(chartData: any[], ticker: string, marketIsOpen: boolean): void {
    this.summarychartOptions = {
      chart: {
        type: 'line',
        backgroundColor: '#F4F4F4'
      },
      title: {
        text: `${ticker.toUpperCase()} Hourly Price Variation`,
        style: {
          color: '#8C8C8C',
        }
      },
      xAxis: {
        type: 'datetime',
        tickInterval: 6 * 3600 * 1000,
        dateTimeLabelFormats: {
          hour: '%H:%M'
        }
      },
      yAxis: {
        title: {
          text: ''
        },
        opposite: true
      },
      plotOptions: {
        line: {
          marker: {
            enabled: false
          }
        }
      },
      series: [{
        name: 'Stock Price',
        data: chartData,
        type: 'line',
        color: marketIsOpen ? 'green' : 'red',
        showInLegend: false
      }]
    };
  };


  
  loadChartData(ticker: string) {
    (async () => {
    this.stockService.getHistoricalData(ticker).subscribe(data => {
        const ohlc = data.map((item: any) => [item.t, item.o, item.h, item.l, item.c]);
        const volume = data.map((item: any) => [item.t, item.v]);
      const  groupingUnits = [[
          'week',                  
          [1]                            
      ], [
          'month',
          [1, 2, 3, 4, 6]
      ]];
        this.chartsOption = {

          rangeSelector: {
            buttons: [
              {
                type: 'month',
                count: 1,
                text: '1m',
              },
              {
                type: 'month',
                count: 3,
                text: '3m',
              },
              {
                type: 'month',
                count: 6,
                text: '6m',
              },
              {
                type: 'ytd',
                text: 'YTD',
              },
              {
                type: 'year',
                count: 1,
                text: '1y',
              },
              {
                type: 'all',
                text: 'All',
              },
            ],
            selected: 2,
            enabled: true,
            inputEnabled: true,
            
            allButtonsEnabled: true,
          },navigator: {
            enabled: true,
          },
          title: {
            text: ticker.toUpperCase() + ' Historical',
            style: {
              
              fontSize: '15',
            },
          },
          legend: { enabled: false },
          subtitle: {
            text: 'With SMA and Volume by Price technical indicators',
            style: {
              color: '#9e9e9f',
              fontSize: '12',
            },
          }, xAxis: {
            ordinal: true,
            
    
            type: 'datetime',
          },
          yAxis: [
            {
              startOnTick: false,
              endOnTick: false,
              labels: {
                align: 'right',
                x: -3,
              },
              title: {
                text: 'OHLC',
              },
              height: '60%',
              lineWidth: 2,
              resize: {
                enabled: true,
              },
              opposite: true,
            },
            {
              labels: {
                align: 'right',
                x: -3,
              },
              title: {
                text: 'Volume',
              },
              top: '65%',
              height: '35%',
              offset: 0,
              lineWidth: 2,
              opposite: true,
            },
          ],
  
          tooltip: {
              split: true
          },
  
          plotOptions: {
              series: {
                  dataGrouping: {
                      units: groupingUnits
                  }
              }
          },
  
          series: [
            {
              type: 'candlestick',
              name: ticker,
              id: ticker,
              zIndex: 2,
              data: ohlc,
            },
            {
              type: 'column',
              name: 'Volume',
              id: 'volume',
              data: volume,
              yAxis: 1,
            },
            {
              // type: 'vbp',
              linkedTo: ticker,
              params: {
                volumeSeriesID: 'volume',
              },
              dataLabels: {
                enabled: false,
              },
              zoneLines: {
                enabled: false,
              },
            },
            {
              // type: 'sma',
              linkedTo: ticker,
              zIndex: 1,
              marker: {
                enabled: false,
              },
            },
          ],
      }
    }, error => {
        console.error('Error fetching historical data:', error);
    });
  })();
}


  checkIfFavorite(stockSymbol: string): void {
    this.stockService.checkStockInWatchlist(stockSymbol).subscribe({
      next: (response) => {
        this.isFavorite = response.isFavorite;
      },
      error: (error) => console.error('Error checking if stock is in watchlist', error)
    });
  }

  isFavorite = false;
  toggleFavorite(stockSymbol: string, companyName: string): void {
    this.isFavorite = !this.isFavorite;
    if (this.isFavorite) {
      this.stockService.addStockToWatchlist(stockSymbol, companyName).subscribe({
        next: (response) => {
          console.log('Stock added to watchlist', response)
          this.watchlistaddErrorMessage = `${companyName} added to watchlist.`;
          this.watchlistaddError = true;
          setTimeout(() => this.watchlistaddError = false, 5000);
        },

        error: (error) => console.error('Failed to add stock to watchlist', error)


      });
    } else {
      this.stockService.removeStockFromWatchlist(stockSymbol).subscribe({
        next: (response) => {
          console.log('Stock removed from watchlist', response)
          this.watchlistdeleteErrorMessage = `${companyName} removed to watchlist.`;
          this.watchlistdeleteError = true; // Show the alert
          setTimeout(() => this.watchlistdeleteError = false, 5000);
        },
        error: (error) => { console.error('Failed to remove stock from watchlist', error) }
      });
    }
  }

  onPeerSelected(event: Event, peer: string): void {
    event.preventDefault();
    this.router.navigate(['search', peer]);
    // this.fetchdata(peer);
  }

  selectNewsItem(newsItem: any, content: any): void {
    this.selectedNewsItem = newsItem;
    this.modalService.open(content, { size: 'md' });
  }

  encodeUriComponent(val: string): string {
    return encodeURIComponent(val);
  }




  displayFn(stock: any): string {
    return stock ? stock.displaySymbol : '';
  }

  onOptionSelected(event: any): void {
    const displaySymbol = event.option.value.displaySymbol;
    this.searchControl.setValue(displaySymbol, { emitEvent: false });
    this.onSearch();
  }

  onSearch(): void {
    this.searchAttempted = true;
    const ticker = this.searchControl.value;
    if (!ticker) {
      this.noDataError = true;
      this.noDataErrorMessage = 'Please enter a ticker symbol.';
      return;
    }
    this.noDataError = false;
    this.router.navigate(['search', ticker]);
  }


  getPortfolio(ticker?: string) {
    this.stockService.getPortfolioData().subscribe((data: any) => {
      this.portfolioData = data;
      console.log("Portfolio data:", this.portfolioData);
  
      this.stockInPortfolio = false;
      this.currentStockQuantity = 0;
  
      if (ticker) {
        console.log("Ticker:", ticker);
        const stock = data[0].stocks.find((s: { Symbol: string; }) => 
          s.Symbol.toLowerCase() === ticker.toLowerCase());
        console.log("Found stock:", stock);
  
        if (stock) {
          this.stockInPortfolio = true;
          this.currentStockQuantity = stock.Quantity;
          console.log(`Stock ${ticker} is in portfolio with quantity:`, this.currentStockQuantity);
        } else {
          console.log(`Stock ${ticker} not found in portfolio.`);
        }
      }
    }, error => {
      console.error('Error fetching portfolio data:', error);
    });
  }
  

  selectbuysellitems(stock: any, content: any): void {
    this.selectedBuyItem = stock;
    this.modalService.open(content, { size: 'md' });
  }

  buyStock(symbol: string, modal: any) {
    if (this.buyquantity > 0 && this.buyquantity * this.stockData.quote.c <= this.portfolioData[0]?.Balance) {
      const buyData = {
        symbol: symbol,
        quantity: this.buyquantity,
        currentPrice: this.stockData.quote.c,
        companyname : this.stockData.profile.name
      };
   
      this.stockService.buyStock(buyData).subscribe({
        next: (response) => {
          console.log('Stock purchased successfully', response);
          this.getPortfolio(symbol)
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
        currentPrice: this.stockData.quote.c,
      };

      console.log(sellData);
      this.stockService.sellStock(sellData).subscribe({
        next: (response) => {
          console.log('Stock sold successfully', response);
          this.getPortfolio(symbol)
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

  
  clearSearch(): void {
    this.searchControl.setValue('');
    this.stockData = null;
    this.errorMessage = '';
    this.noDataError = false;
    this.noDataErrorMessage = '';
    this.searchAttempted = false;
    this.router.navigate(['/search/home']);
  }
}
