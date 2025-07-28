import Transacao from "../models/transacao.js";
import { enviarEmail } from "../services/emailService.js";

class CarteiraController {
  static async depositar(req, res, next) {
    try {
      const { valor } = req.body;
      const usuario = req.usuario;

      usuario.saldoBRL += valor;
      await usuario.save();

      await Transacao.create({
        usuario: usuario._id,
        tipo: "deposito",
        valorBRL: valor
      });

      enviarEmail(
        usuario.email,
        "Depósito realizado",
        `Depósito de R$ ${valor}`
      );

      return res.json({ saldoBRL: usuario.saldoBRL });
    } catch (erro) {
      next(erro);
    }
  }

  static async consultarSaldo(req, res, next) {
    try {
      return res.json({
        saldoBRL: req.usuario.saldoBRL,
        saldoBTC: req.usuario.saldoBTC
      });
    } catch (erro) {
      next(erro);
    }
  }
}

export default CarteiraController;

