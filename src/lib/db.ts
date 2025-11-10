import Dexie, { Table } from 'dexie';
import { Meeting } from './types';

export class LocalDB extends Dexie {
  meetings!: Table<Meeting, string>;
  constructor() {
    super('brief33-db');
    this.version(1).stores({ meetings: 'id, createdAt, title' });
  }
}
export const db = new LocalDB();
