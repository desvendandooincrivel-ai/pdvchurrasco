
export enum Category {
  CARNES = 'Carnes',
  BEBIDAS = 'Bebidas',
  COMBOS = 'Combos',
  EXTRAS = 'Extras'
}

export enum ProductType {
  INDIVIDUAL = 'Individual',
  COMPOSTO = 'Composto',
  COMBO = 'Combo'
}

export enum PaymentMethod {
  MONEY = 'Dinheiro',
  PIX = 'PIX',
  CREDIT = 'Cartão Crédito',
  DEBIT = 'Cartão Débito'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  CAIXA = 'CAIXA'
}

export enum MovementType {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
  AJUSTE = 'AJUSTE',
  VENDA = 'VENDA'
}

export interface User {
  id: string;
  name: string;
  password: string;
  role: UserRole;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  solicitedById: string;
  solicitedByName: string;
  authorizedById: string;
  authorizedByName: string;
  action: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: MovementType;
  quantity: number;
  timestamp: number;
  userId: string;
  userName: string;
  observation?: string;
  paymentMethod?: PaymentMethod;
}

export interface RecipeItem {
  inventoryItemId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  type: ProductType;
  recipe: RecipeItem[];
  imageUrl?: string;
  active: boolean;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface CashRegister {
  id: string;
  openingTime: number;
  closingTime?: number;
  status: 'open' | 'closed';
  initialBalance: number;
  totalSales: number;
  salesCount: number;
  salesByMethod: Record<string, number>;
}

export interface Sale {
  id: string;
  timestamp: number;
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  cashRegisterId: string;
  amountReceived?: number;
  change?: number;
}

export interface AppState {
  inventory: InventoryItem[];
  products: Product[];
  sales: Sale[];
  cashRegisters: CashRegister[];
  users: User[];
  auditLogs: AuditLog[];
  movements: InventoryMovement[];
}
