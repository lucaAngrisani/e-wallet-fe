import { db } from './index';

export async function seedIfEmpty() {
  await db.transaction(
    'rw',
    db.accountTypes,
    db.transactionTypes,
    db.currencies,
    async () => {
      if ((await db.accountTypes.count()) === 0) {
        await db.accountTypes.bulkAdd([
          {
            id: 'BANK_ACCOUNT',
            name: 'Conto Bancario',
            description: 'Conto corrente bancario',
            logicalDelete: 0,
            lastUpdateAt: '',
          },
          {
            id: 'CASH',
            name: 'Contanti',
            description: 'Denaro contante',
            logicalDelete: 0,
            lastUpdateAt: '',
          },
          {
            id: 'CARD',
            name: 'Carta',
            description: 'Carta di credito/debito',
            logicalDelete: 0,
            lastUpdateAt: '',
          },
          {
            id: 'BROKER',
            name: 'Broker',
            description: 'Conto broker',
            logicalDelete: 0,
            lastUpdateAt: '',
          },
          {
            id: 'EXCHANGE',
            name: 'Exchange',
            description: 'Exchange di criptovalute',
            logicalDelete: 0,
            lastUpdateAt: '',
          },
        ]);
        console.log('ACCOUNT TYPE INITIALIZED');
      }

      if ((await db.transactionTypes.count()) === 0) {
        await db.transactionTypes.bulkAdd([
          {
            id: 'TRANSACTION_TYPE_IN',
            name: 'IN',
            color: '#2e7d32',
            description: 'Entrata',
            logicalDelete: 0,
            lastUpdateAt: '',
          },
          {
            id: 'TRANSACTION_TYPE_OUT',
            name: 'OUT',
            color: '#c62828',
            description: 'Uscita',
            logicalDelete: 0,
            lastUpdateAt: '',
          },
          {
            id: 'TRANSACTION_TYPE_TRANSFER',
            name: 'TRANSFER',
            color: '#1565c0',
            description: 'Trasferimento',
            logicalDelete: 0,
            lastUpdateAt: '',
          },
        ]);
        console.log('TRANSACTION TYPE INITIALIZED');
      }

      if ((await db.currencies.count()) === 0) {
        await db.currencies.bulkAdd([
          {
            id: 'EUR',
            name: 'Euro',
            code: 'EUR',
            symbol: '€',
            description: 'Euro',
            logicalDelete: 0,
            lastUpdateAt: '',
          },
        ]);
        console.log('CURRENCY INITIALIZED');
      }
    }
  );

  await db.transaction('rw', db.api, db.apiKey, async () => {
    if ((await db.api.count()) === 0) {
      await db.api.bulkAdd([
        {
          id: 'GET',
          method: 'GET',
          value: '',
          logicalDelete: 0,
          lastUpdateAt: '',
        },
        {
          id: 'POST',
          method: 'POST',
          value: '',
          logicalDelete: 0,
          lastUpdateAt: '',
        },
      ]);
      console.log('API INITIALIZED');
    }

    if ((await db.apiKey.count()) === 0) {
      await db.apiKey.bulkAdd([
        {
          id: 'APIKEY',
          value: '',
          logicalDelete: 0,
          lastUpdateAt: '',
        },
      ]);
      console.log('API_KEY INITIALIZED');
    }
  });

  await db.transaction('rw', db.lastBackupAt, db.lastCleanUpAt, async () => {
    if ((await db.lastBackupAt.count()) === 0) {
      await db.lastBackupAt.bulkAdd([
        {
          id: 'LAST_BACKUP',
          lastBackupAt: '',
        },
      ]);
      console.log('LAST_BACKUP INITIALIZED');
    }

    if ((await db.lastCleanUpAt.count()) === 0) {
      await db.lastCleanUpAt.bulkAdd([
        {
          id: 'LAST_CLEANUP',
          lastCleanUpAt: '',
        },
      ]);
      console.log('LAST_CLEANUP INITIALIZED');
    }
  });
}

//https://e-wall3t-api-821795151520.europe-west8.run.app/json/db_e_wall3t
//lFs45R9s3A98sSre2zP9
