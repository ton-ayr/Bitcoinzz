import mongoose from "mongoose";

const transacaoSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "usuarios", required: true },
    tipo: { type: String, enum: ["deposito", "compra", "venda"], required: true },
    valorBRL: { type: Number, required: true },
    quantidadeBTC: { type: Number },
    data: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export default mongoose.model("transacoes", transacaoSchema);
