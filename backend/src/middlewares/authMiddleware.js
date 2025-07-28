import jwt from "jsonwebtoken";
import Usuario from "../models/usuario.js";

export default async function verificarToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ erro: "Insira um Token" });

  const token = auth.split(" ")[1];
  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = await Usuario.findById(dados.id);
    next();
  } catch {
    res.status(401).json({ erro: "Token inválido" });
  }
}

