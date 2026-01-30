
import { Dexie, type Table } from 'dexie';
import { User, InventoryItem, Product, Sale, CashRegister, AuditLog, InventoryMovement } from '../types';

export class AppDatabase extends Dexie {
  users!: Table<User, string>;
  inventory!: Table<InventoryItem, string>;
  products!: Table<Product, string>;
  sales!: Table<Sale, string>;
  cashRegisters!: Table<CashRegister, string>;
  auditLogs!: Table<AuditLog, string>;
  movements!: Table<InventoryMovement, string>;

  constructor() {
    super('ChurrasControlDB');
    // Define the database schema using the version method inherited from the Dexie base class.
    // Using a named import for Dexie helps ensure that inherited methods like 'version' are properly 
    // recognized by the TypeScript compiler when extending the base class.
    this.version(1).stores({
      users: 'id, name, role',
      inventory: 'id, name',
      products: 'id, name, category, type',
      sales: 'id, timestamp, cashRegisterId',
      cashRegisters: 'id, openingTime, status',
      auditLogs: 'id, timestamp, userId, action',
      movements: 'id, itemId, type, timestamp, userId'
    });
  }
}

export const db = new AppDatabase();
