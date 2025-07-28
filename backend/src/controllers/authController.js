import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Usuario from "../models/usuario.js";

class AuthController {
  static async registrar(req, res, next) {
    try {
      const { nome, email, senha } = req.body;
      const senhaHash = await bcrypt.hash(senha, 9);
      const usuario = new Usuario({ nome, email, senhaHash });
      await usuario.save();
      return res.status(201).json({ mensagem: "Usuario criado" });
    } catch (erro) {
      if (erro.code === 11000) {
        return res.status(401).json({ erro: "Email já cadastrado" });
      }
      next(erro);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, senha } = req.body;
      const usuario = await Usuario.findOne({ email });
      if (!usuario) {
        return res.status(401).json({ erro: "E-mail não encontrado, verifique os dados ou faça seu cadastro." });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
      if (!senhaValida) {
        return res.status(401).json({ erro: "Senha inválida" });
      }

      const token = jwt.sign(
        { id: usuario._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      return res.json({ token });
    } catch (erro) {
      next(erro);
    }
  }
}

export default AuthController;

