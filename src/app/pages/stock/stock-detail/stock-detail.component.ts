import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../templates/card/card.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MarketService } from '../../../services/market.service';
import { TranslateModule } from '@ngx-translate/core';
import { AreaOpts } from '../../../shared/chart.type';

@Component({
  selector: 'app-stock-detail',
  templateUrl: './stock-detail.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    CardComponent,
    NgApexchartsModule,
    TranslateModule,
  ],
})
export default class StockDetailComponent {
  public ticker = input<string>();

  private marketService = inject(MarketService);
  private location = inject(Location);

  public range = signal<string>('3mo');
  public interval = signal<string>('1d');

  public ranges = [
    '1d',
    '5d',
    '1mo',
    '3mo',
    '6mo',
    '1y',
    '2y',
    '5y',
    '10y',
    'ytd',
    'max',
  ];
  public intervals = [
    '1m',
    '2m',
    '5m',
    '15m',
    '30m',
    '60m',
    '90m',
    '1h',
    '1d',
    '5d',
    '1wk',
    '1mo',
    '3mo',
  ];

  public historyData = signal<any>(null);
  public loading = signal<boolean>(false);

  public chartOptions: Signal<AreaOpts> = computed(() => {
    const data = this.historyData();
    const ticker = this.ticker();

    const emptyChart: AreaOpts = {
      series: [],
      chart: {
        type: 'area',
        height: 350,
      },
      xaxis: {
        type: 'datetime',
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      dataLabels: { enabled: false },
      fill: {
        type: 'gradient',
      },
      tooltip: {
        x: { format: 'dd/MM/yy HH:mm' },
      },
    };

    if (!data) {
      return emptyChart;
    }

    let seriesData: any[] = [];

    try {
      // Check if it's the custom structure with "points"
      if (data?.points && Array.isArray(data.points)) {
        seriesData = data.points.map((p: any) => {
          return [p.t, parseFloat(p.c.toFixed(2))];
        });
      }
      // Check if it's Yahoo-like structure
      else if (data?.chart?.result?.[0]) {
        const result = data.chart.result[0];
        const timestamps = result.timestamp;
        const quote = result.indicators?.quote?.[0];
        const closes = quote?.close;

        if (Array.isArray(timestamps) && Array.isArray(closes)) {
          seriesData = timestamps
            .map((t: number, i: number) => {
              if (closes[i] === null || closes[i] === undefined) return null;
              return [t * 1000, parseFloat(closes[i].toFixed(2))]; // ApexCharts expects ms
            })
            .filter((d: any) => d !== null);
        }
      } else if (Array.isArray(data)) {
        // Assume array of { date, close } or similar
        seriesData = data
          .map((d: any) => {
            const timeVal = d.date || d.timestamp || d.time;
            const priceVal = d.close || d.value || d.price;
            if (!timeVal || !priceVal) return null;

            const time = new Date(timeVal).getTime();
            const val = parseFloat(priceVal);
            return [time, val];
          })
          .filter((d) => d !== null);
      }
    } catch (err) {
      console.error('Error parsing chart data', err);
    }

    return {
      series: [
        {
          name: ticker || 'Stock',
          data: seriesData,
        },
      ],
      chart: {
        type: 'area',
        height: 350,
        animations: {
          enabled: false,
        },
        zoom: {
          enabled: true,
        },
      },
      xaxis: {
        type: 'datetime',
        tooltip: {
          enabled: false,
        },
        labels: {
          datetimeUTC: false, // Use local time for simpler reading mostly
        },
      },
      stroke: {
        curve: 'straight',
        width: 2,
      },
      dataLabels: { enabled: false },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.1, // Lighter at bottom
          stops: [0, 100],
        },
      },
      tooltip: {
        x: { format: 'dd/MM/yy HH:mm' },
      },
      colors: ['#0B5FFF'],
    };
  });

  constructor() {
    effect(() => {
      this.loadHistory();
    });
  }

  async loadHistory() {
    const ticker = this.ticker();
    const range = this.range();
    const interval = this.interval();

    if (!ticker) return;

    this.loading.set(true);
    try {
      const result = await this.marketService.getHistory(
        ticker,
        range,
        interval
      );
      this.historyData.set(result);
    } catch (err) {
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.location.back();
  }

  updateFilters() {
      this.loadHistory();
  }
}
