import { Component, computed, inject, Signal, signal } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CardComponent } from '../../templates/card/card.component';
import { TableComponent } from '../../templates/table/table.component';
import { db } from '../../../db';
import { Transaction } from '../../models/transaction.model';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { TableColumn } from '../../templates/table/table-column.type';
import { EmptyStateComponent } from '../../templates/empty-state/empty-state.component';
import { DecimalPipe, DatePipe, CurrencyPipe } from '@angular/common';
import { ColumnComponent } from '../../templates/table/column/column.component';
import { BodyTemplateDirective } from '../../templates/table/directives/body-template.directive';
import { CategoryLabelComponent } from '../../components/category-label/category-label.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { BarOpts } from '../../shared/chart.type';
import { AnnualDetrazione } from '../../models/annual-detrazione.model';
import { SessionStore } from '../../stores/session.store';
import { THEME } from '../../enums/theme.enum';

@Component({
  selector: 'app-detrazioni',
  standalone: true,
  imports: [
    MatSelectModule,
    MatFormFieldModule,
    TranslateModule,
    CardComponent,
    TableComponent,
    DecimalPipe,
    DatePipe,
    CurrencyPipe,
    EmptyStateComponent,
    ColumnComponent,
    BodyTemplateDirective,
    CategoryLabelComponent,
    NgApexchartsModule,
  ],
  templateUrl: './detrazioni.component.html',
})
export default class DetrazioniComponent {
  private translate = inject(TranslateService);
  private sessionStore = inject(SessionStore);
  selectedYear = signal<number>(new Date().getFullYear());

  // Esponi Math per usarlo nei template
  Math = Math;

  // Query reattiva per le configurazioni annuali detrazioni
  private allAnnualDetrazioni = toSignal(
    from(
      liveQuery(async () => {
        const items = await db.annualDetrazioni
          .filter((item) => item.logicalDelete !== 1)
          .toArray();
        return items.map((item) => new AnnualDetrazione().from(item));
      }),
    ),
    { initialValue: [] as AnnualDetrazione[] },
  );

  // Ottiene la configurazione detrazione per l'anno selezionato
  currentYearDetrazione = computed(() => {
    const year = this.selectedYear();
    return this.allAnnualDetrazioni().find((d) => d.year === year);
  });

  // Genera gli ultimi 10 anni
  availableYears = computed(() => {
    const currentYear = new Date().getFullYear() + 10;
    const years: number[] = [];
    for (let i = 0; i < 20; i++) {
      years.push(currentYear - i);
    }
    return years;
  });

  // Query reattiva per tutte le transazioni con detrazione
  private allTransactionsWithDetrazioni = toSignal(
    from(
      liveQuery(async () => {
        const allTxs = await db.transactions
          .filter((tx) => tx.logicalDelete !== 1 && tx.detrazione != null)
          .toArray();

        return allTxs.map((tx) => new Transaction().from(tx));
      }),
    ),
    { initialValue: [] as Transaction[] },
  );

  // Query per ottenere le transazioni con detrazione dell'anno selezionato
  // Include anche transazioni degli anni precedenti se la detrazione è ancora valida
  transactions = computed(() => {
    const year = this.selectedYear();
    const allTxsSignal = this.allTransactionsWithDetrazioni();

    // Filtra le transazioni che sono valide nell'anno selezionato
    const filtered = allTxsSignal.filter((tx) => {
      const txYear = new Date(tx.date).getFullYear();
      const yearsValid = Number(tx.detrazione?.years) || 1;

      // La detrazione è valida per N anni a partire dall'anno della transazione
      // Es: transazione 2026, 10 anni → valida dal 2026 al 2035 (inclusi)
      // Formula: anno transazione + anni - 1
      const endYear = txYear + yearsValid - 1;

      // La transazione è valida se l'anno selezionato è tra l'anno della transazione e l'anno finale
      return year >= txYear && year <= endYear;
    });

    // Ordina per data crescente
    return filtered.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  });

  columns: TableColumn[] = [
    {
      label: this.translate.instant('transaction-list.date'),
      propName: 'date',
    },
    {
      label: this.translate.instant('transaction-list.description'),
      propName: 'description',
    },
    {
      label: this.translate.instant('transaction-list.amount'),
      propName: 'amount',
    },
    {
      label: this.translate.instant('detrazioni.annual-amount'),
      propName: 'annualAmount',
    },
    {
      label: this.translate.instant('transaction.detrazione'),
      propName: 'detrazione',
    },
  ];

  // Raggruppa le transazioni per tipologia di detrazione con totale calcolato
  detrazioniByType = computed(() => {
    const year = this.selectedYear();
    const config = this.currentYearDetrazione();
    const txs = this.transactions();

    if (!config) return [];

    // Raggruppa per detrazione ID
    const grouped = new Map<
      string,
      { detrazione: any; transactions: Transaction[]; total: number }
    >();

    txs.forEach((tx) => {
      if (!tx.detrazione?.id) return;

      if (!grouped.has(tx.detrazione.id)) {
        grouped.set(tx.detrazione.id, {
          detrazione: tx.detrazione,
          transactions: [],
          total: 0,
        });
      }

      grouped.get(tx.detrazione.id)!.transactions.push(tx);
    });

    // Calcola il totale per ogni tipologia considerando franchigia e massimale
    const result: Array<{
      name: string;
      total: number;
      rawTotal: number;
      baseImponibile: number;
      franchigia?: number;
      massimale?: number;
      percentage: number;
      years: number;
    }> = [];

    grouped.forEach((group, detrazioneId) => {
      // Trova la configurazione annuale per questa detrazione
      const annualConfig = config.detrazioni.find(
        (d) => d.detrazioneId === detrazioneId,
      );

      const percentage = Number(group.detrazione.amount) || 0;
      const years = Number(group.detrazione.years) || 1;

      // Calcola il totale delle SPESE LORDE (non la detrazione)
      const rawTotal = group.transactions.reduce((sum, tx) => {
        return sum + tx.amount;
      }, 0);

      // Applica massimale SULLE SPESE: il massimale è la massima cifra su cui applicare la detrazione
      let baseImponibile = rawTotal;
      if (annualConfig?.massimale && baseImponibile > annualConfig.massimale) {
        baseImponibile = annualConfig.massimale;
      }

      // Applica franchigia SULLE SPESE: la detrazione parte solo dopo che la franchigia è superata
      let baseNetta = baseImponibile;
      if (annualConfig?.franchigia) {
        if (baseImponibile > annualConfig.franchigia) {
          baseNetta = baseImponibile - annualConfig.franchigia;
        } else {
          baseNetta = 0; // Non supera la franchigia
        }
      }

      // ORA calcola la detrazione sulla base netta
      const total = baseNetta * (percentage / 100) * (1 / years);

      result.push({
        name: group.detrazione.name,
        total,
        rawTotal,
        baseImponibile,
        franchigia: annualConfig?.franchigia,
        massimale: annualConfig?.massimale,
        percentage,
        years,
      });
    });

    return result;
  });

  // Calcola la detrazione annua raw per una transazione (senza franchigia/massimale)
  // Formula: valore transazione * (detrazione.amount/100) * (1/detrazione.years)
  getAnnualDeductionRaw(tx: Transaction): number {
    const years = Number(tx.detrazione?.years);
    const amount = Number(tx.detrazione?.amount);

    if (!years || years === 0 || !amount) {
      return 0;
    }
    return tx.amount * (amount / 100) * (1 / years);
  }

  // Calcola la detrazione annua per una transazione considerando franchigia e massimale
  getAnnualDeduction(tx: Transaction): number {
    if (!tx.detrazione?.id) return 0;

    const detrazioneType = this.detrazioniByType().find(
      (d) => d.name === tx.detrazione?.name,
    );

    if (!detrazioneType) return this.getAnnualDeductionRaw(tx);

    // Se questa tipologia ha una detrazione totale > 0, calcola la proporzione
    if (detrazioneType.rawTotal > 0) {
      const proportion =
        this.getAnnualDeductionRaw(tx) / detrazioneType.rawTotal;
      return detrazioneType.total * proportion;
    }

    return 0;
  }

  onYearChange(year: number) {
    this.selectedYear.set(year);
  }

  // Totale detrazioni considerando franchigia e massimale per tipo
  totalAmount = computed(() => {
    return this.detrazioniByType().reduce((sum, group) => sum + group.total, 0);
  });

  // Grafico per tipologia di detrazione
  detrazioneByTypeChart = computed<BarOpts>(() => {
    const byType = this.detrazioniByType();

    return {
      series: [
        {
          name: this.translate.instant('detrazioni.amount-by-type'),
          data: byType.map((d) => Math.round(d.total)),
        },
      ],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          dataLabels: {
            position: 'top',
          },
        },
      },
      xaxis: {
        categories: byType.map((d) => d.name),
      },
      yaxis: {
        labels: {
          formatter: (val: any) => Math.round(Number(val || 0)).toString(),
        },
        forceNiceScale: true,
      },
      dataLabels: {
        enabled: true,
        formatter: (val: any) => `€${Math.round(Number(val || 0))}`,
        offsetY: -20,
        style: {
          fontSize: '12px',
        },
      },
      tooltip: {
        enabled: true,
        custom: ({ series, seriesIndex, dataPointIndex, w }: any) => {
          const item = byType[dataPointIndex];
          let html = `<div class="p-3">
            <div class="font-bold mb-2">${item.name}</div>
            <div>Totale grezzo: €${item.rawTotal.toFixed(2)}</div>`;

          if (item.franchigia) {
            html += `<div>Franchigia: €${item.franchigia.toFixed(2)}</div>`;
            if (item.rawTotal <= item.franchigia) {
              html += `<div class="text-red-500">Sotto franchigia - non detraibile</div>`;
            }
          }

          if (item.massimale) {
            html += `<div>Massimale: €${item.massimale.toFixed(2)}</div>`;
            if (item.rawTotal > item.massimale) {
              html += `<div class="text-orange-500">Sopra massimale - limitato</div>`;
            }
          }

          html += `<div class="font-bold mt-2">Detraibile: €${item.total.toFixed(2)}</div>
          </div>`;

          return html;
        },
      },
      theme: {
        mode:
          this.sessionStore.themeSelected() === THEME.DARK ? 'dark' : 'light',
      },
    };
  });

  // Grafico delle detrazioni utilizzate vs disponibili
  detrazioneChart = computed<BarOpts>(() => {
    const used = this.totalAmount();
    const max = this.currentYearDetrazione()?.massimoDetraibile || 0;
    const remaining = Math.max(0, max - used);

    return {
      series: [
        {
          name: this.translate.instant('detrazioni.used'),
          data: [used],
        },
        {
          name: this.translate.instant('detrazioni.remaining'),
          data: [remaining],
        },
      ],
      chart: {
        type: 'bar',
        height: 300,
        stacked: true,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          dataLabels: {
            total: {
              enabled: false,
            },
          },
        },
      },
      xaxis: {
        categories: [''],
        labels: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          show: false,
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: any) => `€${Number(val || 0).toFixed(2)}`,
      },
      theme: {
        mode:
          this.sessionStore.themeSelected() === THEME.DARK ? 'dark' : 'light',
      },
    };
  });
}
