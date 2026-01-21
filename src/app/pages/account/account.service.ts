import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { TableColumn } from '../../templates/table/table-column.type';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';
import { db } from '../../../db';
import { AccountRow } from '../../../db/models';
import { Account } from '../../models/account.model';
import { CurrencySymbolsService } from '../../services/currency-symbols.service';
import { PieOpts } from '../../shared/chart.type';
import { SessionStore } from '../../stores/session.store';
import { THEME } from '../../enums/theme.enum';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private sessionStore = inject(SessionStore);
  private translate = inject(TranslateService);
  private currencySymbolsService = inject(CurrencySymbolsService);

  allAccountLists: Signal<Account[]> = toSignal(
    from(
      liveQuery(() =>
        db.accounts
          .orderBy('balance')
          .reverse()
          .filter((a) => a.logicalDelete != 1)
          .toArray()
          ?.then((list) => {
            return list.map((item) => new Account().from(item));
          })
      )
    ),
    { initialValue: [] as Account[] }
  );

  columns: Signal<TableColumn[]> = signal([
    { label: this.translate.instant('account-list.name'), propName: 'name' },
    {
      label: this.translate.instant('account-list.balance'),
      propName: 'balance',
    },
    {
      label: this.translate.instant('account-list.type'),
      propName: 'type',
      sortBy: 'type.name',
      hideOnMobile: true,
    },
    {
      label: '',
      propName: 'actions',
    },
  ]);

  async updateAccount(account: Account) {
    account.lastUpdateAt = new Date();
    await db.accounts.put(account.toMap() as AccountRow);
  }

  async deleteAccount(id: string) {
    await db.accounts.update(id, { logicalDelete: 1, lastUpdateAt: new Date().toISOString() });
  }

  async getById(id: string): Promise<Account | undefined> {
    const row = await db.accounts.get(id);
    return row ? new Account().from(row) : undefined;
  }

  public totalBalance = computed(() =>
    this.allAccountLists().reduce((sum, acc) => {
      let balance = acc.balance;

      if (acc.stocks && acc.stocks.length > 0) {
        const stockBalance = acc.stocks.reduce(
          (val, stock) => val + (stock.lastValue || 0) * (stock.numStocks || 0),
          0
        );

        if (stockBalance > acc.balance) {
          const tax = this.sessionStore.taxOnCapitalGains() || 0;
          balance =
            acc.balance + (stockBalance - acc.balance) * ((100 - tax) / 100);
        } else {
          balance = stockBalance;
        }
      }

      return (
        sum +
        balance *
          (this.currencySymbolsService.currenciesPrices()[acc.currency.code] ||
            1)
      );
    }, 0)
  );

  private accountBalance: Signal<
    {
      category: string;
      amount: number;
      currency: string;
      percentage: number;
    }[]
  > = computed(() => {
    const accountList = this.allAccountLists();
    const total = this.totalBalance();

    return accountList
      .map((group) => ({
        category: group.name,
        amount: parseFloat(group.balance.toFixed(2)),
        currency: group.currency.code,
        percentage: total ? group.balance / total : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  });

  public balancePie: Signal<PieOpts> = computed(() => ({
    series: this.accountBalance().map((v) => v.amount),
    chart: { type: 'pie', height: 320 },
    labels: this.accountBalance().map((v) => v.category),
    responsive: [
      { breakpoint: 480, options: { legend: { position: 'bottom', height: 80 } } },
    ],
    legend: { position: 'right', offsetY: 0, height: 230 },
    theme: {
      mode: this.sessionStore.themeSelected() === THEME.DARK ? 'dark' : 'light',
    },
  }));
}
