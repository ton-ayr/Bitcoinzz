import { model, Schema, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // `select: false`: o hash da senha só vem do banco quando pedido explicitamente.
    passwordHash: { type: String, required: true, select: false },
    // Saldo em centavos (inteiro). Nunca negativo.
    balanceCents: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

// Coleção "users": não colide com a coleção "usuarios" da v1.
export const UserModel = model('User', userSchema);
