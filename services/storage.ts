
import { db } from './db';
import { 
  AppState, Sale, InventoryItem, Product, SaleItem, 
  CashRegister, PaymentMethod, User, AuditLog, 
  InventoryMovement, MovementType, ProductType
} from '../types';
import { INITIAL_INVENTORY, INITIAL_PRODUCTS, INITIAL_USERS, HISTORICAL_REGISTERS, HISTORICAL_SALES, HISTORICAL_LOGS } from '../constants';

export const loadState = async (): Promise<AppState> => {
  const usersCount = await db.users.count();
  
  if (usersCount === 0) {
    await db.users.bulkAdd(INITIAL_USERS);
    await db.inventory.bulkAdd(INITIAL_INVENTORY);
    await db.products.bulkAdd(INITIAL_PRODUCTS);
    await db.cashRegisters.bulkAdd(HISTORICAL_REGISTERS);
    await db.sales.bulkAdd(HISTORICAL_SALES);
    await db.auditLogs.bulkAdd(HISTORICAL_LOGS);
  }

  return {
    users: await db.users.toArray(),
    inventory: await db.inventory.toArray(),
    products: await db.products.toArray(),
    sales: await db.sales.orderBy('timestamp').reverse().toArray(),
    cashRegisters: await db.cashRegisters.orderBy('openingTime').reverse().toArray(),
    auditLogs: await db.auditLogs.orderBy('timestamp').reverse().toArray(),
    movements: await db.movements.orderBy('timestamp').reverse().toArray()
  };
};

/**
 * Adiciona Log de Auditoria com suporte a Solicitante e Autorizador
 */
export const addAuditLog = async (
  solicitor: User, 
  authorizer: User, 
  logData: Omit<AuditLog, 'id' | 'timestamp' | 'solicitedById' | 'solicitedByName' | 'authorizedById' | 'authorizedByName'>
): Promise<AuditLog> => {
  const newLog: AuditLog = {
    ...logData,
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    solicitedById: solicitor.id,
    solicitedByName: solicitor.name,
    authorizedById: authorizer.id,
    authorizedByName: authorizer.name
  };
  await db.auditLogs.add(newLog);
  return newLog;
};

export const addStockMovement = async (user: User, move: Omit<InventoryMovement, 'id' | 'timestamp' | 'userId' | 'userName'>): Promise<InventoryMovement> => {
  const newMove: InventoryMovement = {
    ...move,
    id: `move_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    userId: user.id,
    userName: user.name
  };
  await db.movements.add(newMove);
  return newMove;
};

export const upsertUser = async (admin: User, targetUser: User): Promise<void> => {
  const existing = await db.users.get(targetUser.id);
  await db.users.put(targetUser);
  await addAuditLog(admin, admin, {
    action: existing ? 'EDITAR_USUARIO' : 'CRIAR_USUARIO',
    details: `${existing ? 'Editou' : 'Criou'} o usuário "${targetUser.name}"`,
  });
};

export const deleteUser = async (admin: User, userId: string): Promise<void> => {
  const target = await db.users.get(userId);
  if (!target) return;
  if (target.id === admin.id) throw new Error("Você não pode excluir seu próprio usuário.");
  await db.users.delete(userId);
  await addAuditLog(admin, admin, { action: 'EXCLUIR_USUARIO', details: `Excluiu "${target.name}"` });
};

export const getActiveRegister = async (): Promise<CashRegister | undefined> => {
  return await db.cashRegisters.where('status').equals('open').first();
};

export const openRegister = async (solicitor: User, authorizer: User, initialBalance: number): Promise<CashRegister> => {
  const newRegister: CashRegister = {
    id: `reg_${Date.now()}`,
    openingTime: Date.now(),
    status: 'open',
    initialBalance,
    totalSales: 0,
    salesCount: 0,
    salesByMethod: { [PaymentMethod.MONEY]: 0, [PaymentMethod.PIX]: 0, [PaymentMethod.CREDIT]: 0, [PaymentMethod.DEBIT]: 0 }
  };
  await db.cashRegisters.add(newRegister);
  await addAuditLog(solicitor, authorizer, { 
    action: 'ABERTURA_CAIXA', 
    details: `Caixa aberto com R$ ${initialBalance.toFixed(2)}` 
  });
  return newRegister;
};

export const closeRegister = async (solicitor: User, authorizer: User): Promise<void> => {
  const active = await getActiveRegister();
  if (!active) return;
  const registerSales = await db.sales.where('cashRegisterId').equals(active.id).toArray();
  const totalSales = registerSales.reduce((acc, s) => acc + s.total, 0);
  await db.cashRegisters.update(active.id, { 
    status: 'closed', 
    closingTime: Date.now(), 
    totalSales, 
    salesCount: registerSales.length 
  });
  await addAuditLog(solicitor, authorizer, { 
    action: 'FECHAMENTO_CAIXA', 
    details: `Total vendido: R$ ${totalSales.toFixed(2)}` 
  });
};

export const updateInventoryManual = async (solicitor: User, authorizer: User, itemId: string, newQty: number): Promise<void> => {
  const item = await db.inventory.get(itemId);
  if (!item) return;
  const diff = newQty - item.quantity;
  await db.inventory.update(itemId, { quantity: newQty });
  
  await addStockMovement(solicitor, { itemId, itemName: item.name, type: MovementType.AJUSTE, quantity: diff });
  
  await addAuditLog(solicitor, authorizer, {
    action: 'AJUSTE_ESTOQUE',
    details: `Ajuste manual de "${item.name}" para ${newQty} ${item.unit}`,
    previousValue: item.quantity.toString(),
    newValue: newQty.toString()
  });
};

export const upsertProduct = async (solicitor: User, authorizer: User, product: Product): Promise<void> => {
  if (product.type === ProductType.INDIVIDUAL) {
    const invId = `inv_${product.id}`;
    const existingInv = await db.inventory.get(invId);
    if (!existingInv) {
      await db.inventory.add({ id: invId, name: product.name, quantity: 0, minQuantity: 5, unit: 'un' });
    } else if (existingInv.name !== product.name) {
      await db.inventory.update(invId, { name: product.name });
    }
    product.recipe = [{ inventoryItemId: invId, quantity: 1 }];
  }

  const existing = await db.products.get(product.id);
  await db.products.put(product);
  
  await addAuditLog(solicitor, authorizer, {
    action: existing ? 'EDITAR_PRODUTO' : 'ADICIONAR_PRODUTO',
    details: `${existing ? 'Editou' : 'Adicionou'} o produto "${product.name}" (Preço: R$ ${product.price})`,
    previousValue: existing ? `R$ ${existing.price}` : undefined,
    newValue: `R$ ${product.price}`
  });
};

export const deleteProduct = async (solicitor: User, authorizer: User, productId: string): Promise<void> => {
  const product = await db.products.get(productId);
  if (!product) return;
  const sales = await db.sales.toArray();
  const hasHistory = sales.some(s => s.items.some(i => i.productId === productId));
  
  if (hasHistory) {
    await db.products.update(productId, { active: false });
    await addAuditLog(solicitor, authorizer, { action: 'INATIVAR_PRODUTO', details: `Inativou "${product.name}" por ter histórico` });
  } else {
    await db.products.delete(productId);
    if (product.type === ProductType.INDIVIDUAL) {
      const invId = `inv_${product.id}`;
      await db.inventory.delete(invId);
    }
    await addAuditLog(solicitor, authorizer, { action: 'EXCLUIR_PRODUTO', details: `Excluiu "${product.name}" permanentemente` });
  }
};

export const calculateTotalRequirement = async (cartItems: SaleItem[]): Promise<Record<string, number>> => {
  const requirement: Record<string, number> = {};
  const products = await db.products.toArray();

  const resolve = (productId: string, qty: number) => {
    const p = products.find(x => x.id === productId);
    if (!p) return;
    if (p.type === ProductType.COMBO) {
      p.recipe.forEach(r => resolve(r.inventoryItemId, r.quantity * qty));
    } else {
      p.recipe.forEach(r => {
        requirement[r.inventoryItemId] = (requirement[r.inventoryItemId] || 0) + (r.quantity * qty);
      });
    }
  };

  cartItems.forEach(item => resolve(item.productId, item.quantity));
  return requirement;
};

export const processSale = async (user: User, sale: Sale): Promise<void> => {
  const requirements = await calculateTotalRequirement(sale.items);
  for (const [invId, needed] of Object.entries(requirements)) {
    const invItem = await db.inventory.get(invId);
    if (invItem) {
      if (invItem.quantity < needed) throw new Error(`Estoque insuficiente: ${invItem.name}`);
      const newQty = invItem.quantity - needed;
      await db.inventory.update(invId, { quantity: newQty });
      await addStockMovement(user, { itemId: invId, itemName: invItem.name, type: MovementType.VENDA, quantity: -needed });
    }
  }
  await db.sales.add(sale);
};
