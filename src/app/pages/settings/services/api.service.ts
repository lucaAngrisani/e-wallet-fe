import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { db } from '../../../../db';
import { firstValueFrom } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { exportDb, mergeDb } from '../../../../db/logic';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  getApiUrl: WritableSignal<string | null> = signal(null);
  postApiUrl: WritableSignal<string | null> = signal(null);
  apiKey: WritableSignal<string | null> = signal(null);

  async init() {
    const getRow = await db.api.where('id').equals('GET').first();

    if (getRow) {
      this.getApiUrl.set(getRow.value || null);
    }

    const postRow = await db.api.where('id').equals('POST').first();

    if (postRow) {
      this.postApiUrl.set(postRow.value || null);
    }

    const apiKeyRow = await db.apiKey.where('id').equals('APIKEY').first();

    if (apiKeyRow) {
      this.apiKey.set(apiKeyRow.value || null);
    }
  }

  saveGETApiUrl(url: string | null) {
    db.api.put({
      id: 'GET',
      method: 'GET',
      value: url || '',
      lastUpdateAt: new Date().toISOString(),
    });
  }

  savePOSTApiUrl(url: string | null) {
    db.api.put({
      id: 'POST',
      method: 'POST',
      value: url || '',
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
    if (!this.getApiUrl()) return Promise.resolve({} as T);

    return firstValueFrom(
      this.http.get<T>(`${this.getApiUrl()}`, {
        headers: new HttpHeaders({
          'X-Api-Key': this.apiKey() || '',
          'Content-Type': 'application/json',
        }),
      })
    ).catch(() => Promise.resolve({} as T));
  }

  /** Crea/Aggiorna un JSON */
  saveJson(data: any): Promise<any> {
    if (!this.postApiUrl()) return Promise.resolve({});

    return firstValueFrom(
      this.http.post(`${this.postApiUrl()}`, JSON.stringify(data), {
        headers: new HttpHeaders({
          'X-Api-Key': this.apiKey() || '',
          'Content-Type': 'application/json',
        }),
      })
    );
  }

  async syncDb(ignoreCloud: boolean = false): Promise<void> {
    if (!this.postApiUrl() || !this.getApiUrl()) return;

    if (ignoreCloud) {
      console.log('SYNC DB - FORCE UPLOAD');
      await this.saveJson(await exportDb());
    } else {
      const cloudDb = await this.getJson();
      const localDb = await exportDb();

      if (JSON.stringify(cloudDb) !== JSON.stringify(localDb)) {
        console.log('SYNC DB');
        await this.saveJson(await mergeDb(localDb, cloudDb));
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
        7 * 24 * 60 * 60 * 1000
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

    await this.syncDb(true);
  }
}
