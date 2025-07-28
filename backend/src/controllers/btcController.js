import Transacao from "../models/transacao.js";
import { obterCotacao } from "../services/apiBTCService.js";
import { enviarEmail } from "../services/emailService.js";

class BtcController {
  static async obterPreco(req, res, next) {
    try {
      const cotacao = await obterCotacao();
      return res.json(cotacao);
    } catch (erro) {
      next(erro);
    }
  }

  static async comprar(req, res, next) {
    try {
      const valor = Number(parseFloat(req.body.valor).toFixed(2));
      if (isNaN(valor) || valor <= 0) {
        return res.status(400).json({ erro: "Valor inválido" });
      }

      const usuario = req.usuario;
      const { venda } = await obterCotacao();

      const saldoDisponivel = Number(usuario.saldoBRL.toFixed(2));

      if (valor > saldoDisponivel) {
        return res.status(400).json({ erro: "Saldo insuficiente" });
      }

      const quantidadeBTC = Number((valor / venda).toFixed(8));

      usuario.saldoBRL = Number((saldoDisponivel - valor).toFixed(2));
      usuario.saldoBTC = Number((usuario.saldoBTC + quantidadeBTC).toFixed(8));
      await usuario.save();

      await Transacao.create({
        usuario: usuario._id,
        tipo: "compra",
        valorBRL: valor,
        quantidadeBTC,
      });

      await enviarEmail(
        usuario.email,
        "Compra de BTC",
        `Você comprou ${quantidadeBTC.toFixed(8)} BTC por R$ ${valor.toFixed(2)}`
      );

      return res.status(201).json({ quantidadeBTC, valorBRL: valor });
    } catch (erro) {
      next(erro);
    }
  }

  static async vender(req, res, next) {
    try {
      const quantidade = Number(parseFloat(req.body.quantidade).toFixed(8));
      if (isNaN(quantidade) || quantidade <= 0) {
        return res.status(400).json({ erro: "Quantidade inválida" });
      }

      const usuario = req.usuario;
      const { compra } = await obterCotacao();

      const saldoBTC = Number(usuario.saldoBTC.toFixed(8));

      if (quantidade > saldoBTC) {
        return res.status(400).json({ erro: "Saldo de BTC insuficiente" });
      }

      const valorBRL = Number((quantidade * compra).toFixed(2));

      usuario.saldoBTC = Number((saldoBTC - quantidade).toFixed(8));
      usuario.saldoBRL = Number((usuario.saldoBRL + valorBRL).toFixed(2));
      await usuario.save();

      await Transacao.create({
        usuario: usuario._id,
        tipo: "venda",
        valorBRL,
        quantidadeBTC: quantidade,
      });

      await enviarEmail(
        usuario.email,
        "Venda de BTC",
        `Você vendeu ${quantidade.toFixed(8)} BTC por R$ ${valorBRL.toFixed(2)}`
      );

      return res.json({ quantidadeBTC: quantidade, valorBRL });
    } catch (erro) {
      next(erro);
    }
  }
}

export default BtcController;
