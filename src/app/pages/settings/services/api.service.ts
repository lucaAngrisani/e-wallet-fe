import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { db } from '../../../../db';
import { firstValueFrom } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { exportDb, mergeDb } from '../../../../db/logic';
import { ToastService } from '../../../services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { API } from '../../../api';
import { SessionStore } from '../../../stores/session.store';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private translate = inject(TranslateService);
  private toastSvc = inject(ToastService);
  private http = inject(HttpClient);
  private sessionStore = inject(SessionStore);

  databaseName: WritableSignal<string | null> = signal(null);
  apiKey: WritableSignal<string | null> = signal(null);

  async init() {
    const dbNameRow = await db.api.where('id').equals('DB_NAME').first();

    if (dbNameRow) {
      this.databaseName.set(dbNameRow.value || null);
    }

    const apiKeyRow = await db.apiKey.where('id').equals('APIKEY').first();

    if (apiKeyRow) {
      this.apiKey.set(apiKeyRow.value || null);
    }
  }

  saveDatabaseName(name: string | null) {
    db.api.put({
      id: 'DB_NAME',
      method: 'DB_NAME',
      value: name || '',
      lastUpdateAt: new Date().toISOString(),
    });
  }

  saveApiKey(value: string | null) {
    db.apiKey.put({
      id: 'APIKEY',
      value: value || '',
      lastUpdateAt: new Date().toISOString(),
    });
  }

  /** Legge un JSON */
  getJson<T = any>(): Promise<T> {
    const dbName = this.databaseName();
    if (!dbName) return Promise.resolve({} as T);

    const url = `${API.DB.BASE_URL}/${dbName}`;

    return firstValueFrom(
      this.http.get<T>(url, {
        headers: new HttpHeaders({
          'X-Api-Key': this.apiKey() || '',
          'Content-Type': 'application/json',
        }),
      })
    ).catch(() => Promise.resolve({} as T));
  }

  /** Crea/Aggiorna un JSON */
  saveJson(data: any): Promise<any> {
    const dbName = this.databaseName();
    if (!dbName) return Promise.resolve({});

    const url = `${API.DB.BASE_URL}/${dbName}`;

    return firstValueFrom(
      this.http.post(url, JSON.stringify(data), {
        headers: new HttpHeaders({
          'X-Api-Key': this.apiKey() || '',
          'Content-Type': 'application/json',
        }),
      })
    );
  }

  async syncDb(ignoreCloud: boolean = false): Promise<void> {
    if (!this.databaseName()) return;

    if (ignoreCloud) {
      console.log('SYNC DB - FORCE UPLOAD');
      await this.saveJson(await exportDb());
    } else {
      const cloudDb = await this.getJson();
      const localDb = await exportDb();

      if (JSON.stringify(cloudDb) !== JSON.stringify(localDb)) {
        console.log('SYNC DB');
        await this.saveJson(await mergeDb(localDb, cloudDb));
        this.sessionStore.hydrate();
        this.toastSvc.success(this.translate.instant('toast.syncing-db'));
      } else {
        console.log('DB SYNCED');
      }
    }
  }

  async cleanUpDb(): Promise<void> {
    const lastCleanUp = await db.lastCleanUpAt
      .where('id')
      .equals('LAST_CLEANUP')
      .first();

    if (
      lastCleanUp?.lastCleanUpAt &&
      new Date().getTime() - new Date(lastCleanUp.lastCleanUpAt).getTime() <
        24 * 60 * 60 * 1000
    ) {
      return;
    }

    console.log('CLEAN UP DB - INIT');
    const now = new Date().toISOString();

    await db.lastCleanUpAt.put({ id: 'LAST_CLEANUP', lastCleanUpAt: now });

    await Promise.all([
      db.accounts.where('logicalDelete').equals(1).delete(),
      db.transactions.where('logicalDelete').equals(1).delete(),
      db.plans.where('logicalDelete').equals(1).delete(),
      db.holdings.where('logicalDelete').equals(1).delete(),
      db.categories.where('logicalDelete').equals(1).delete(),
      db.schedules.where('logicalDelete').equals(1).delete(),
      db.accountTypes.where('logicalDelete').equals(1).delete(),
      db.transactionTypes.where('logicalDelete').equals(1).delete(),
      db.currencies.where('logicalDelete').equals(1).delete(),
      db.api.where('logicalDelete').equals(1).delete(),
      db.apiKey.where('logicalDelete').equals(1).delete(),
    ]);

    console.log('CLEAN UP DB - DONE');

    this.toastSvc.warn(this.translate.instant('toast.clean-up-db'));

    await this.syncDb(true);
  }
}
