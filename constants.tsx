
import { Category, ProductType, InventoryItem, Product, User, UserRole, CashRegister, Sale, PaymentMethod, AuditLog } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'u_1', name: 'Administrador', password: 'admin', role: UserRole.ADMIN },
  { id: 'u_2', name: 'Caixa 01', password: '123', role: UserRole.CAIXA },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv_1', name: 'Carne (Espetinho)', quantity: 150, minQuantity: 10, unit: 'un' },
  { id: 'inv_2', name: 'Frango (Espetinho)', quantity: 120, minQuantity: 10, unit: 'un' },
  { id: 'inv_4', name: 'Coca-Cola 350ml', quantity: 48, minQuantity: 6, unit: 'un' },
  { id: 'inv_5', name: 'Cerveja Lata', quantity: 72, minQuantity: 12, unit: 'un' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Espetinho de Carne',
    category: Category.CARNES,
    price: 12.00,
    type: ProductType.COMPOSTO,
    recipe: [{ inventoryItemId: 'inv_1', quantity: 1 }],
    active: true
  },
  {
    id: 'prod_3',
    name: 'Coca-Cola',
    category: Category.BEBIDAS,
    price: 6.00,
    type: ProductType.INDIVIDUAL,
    recipe: [{ inventoryItemId: 'inv_4', quantity: 1 }],
    active: true
  },
  {
    id: 'prod_4',
    name: 'Combo Churrasco',
    category: Category.COMBOS,
    price: 28.00,
    type: ProductType.COMBO,
    recipe: [
      { inventoryItemId: 'prod_1', quantity: 2 },
      { inventoryItemId: 'prod_3', quantity: 1 }
    ],
    active: true
  }
];

const dayMs = 24 * 60 * 60 * 1000;
const threeDaysAgo = Date.now() - (3 * dayMs);
const threeDaysAgoDate = new Date(threeDaysAgo);
threeDaysAgoDate.setHours(18, 0, 0, 0);
const startTime = threeDaysAgoDate.getTime();

export const HISTORICAL_REGISTERS: CashRegister[] = [
  {
    id: 'reg_hist_1',
    openingTime: startTime,
    closingTime: startTime + (5 * 60 * 60 * 1000) + (30 * 60 * 1000),
    status: 'closed',
    initialBalance: 100.00,
    totalSales: 452.00,
    salesCount: 5,
    salesByMethod: {
      [PaymentMethod.MONEY]: 120.00,
      [PaymentMethod.PIX]: 210.00,
      [PaymentMethod.CREDIT]: 61.00,
      [PaymentMethod.DEBIT]: 61.00
    }
  }
];

export const HISTORICAL_SALES: Sale[] = [];
export const HISTORICAL_LOGS: AuditLog[] = [];
