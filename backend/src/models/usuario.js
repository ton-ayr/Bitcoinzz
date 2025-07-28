import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senhaHash: { type: String, required: true },
    saldoBRL: { type: Number, default: 0 },
    saldoBTC: { type: Number, default: 0 }
  },
  { versionKey: false }
);

export default mongoose.model("usuarios", usuarioSchema);
