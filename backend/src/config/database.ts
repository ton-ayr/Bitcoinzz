import mongoose from 'mongoose';

// Com esta opção, toda operação feita dentro de `connection.transaction()` usa a
// sessão da transação automaticamente, sem precisar passar `{ session }` em cada chamada.
mongoose.set('transactionAsyncLocalStorage', true);

export async function connectDatabase(uri: string): Promise<void> {
  await mongoose.connect(uri);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}
