import express from "express";
import conectaDatabase from "./config/dbConnect.js";
import path from "path";
import rotas from "./routes/index.js";

const conexao = await conectaDatabase();

conexao.on("error", (erro) => {
    console.error("Erro de conexão", erro)
});

conexao.once("open", () => {
    console.log("Conexão com banco realizada")
});

const app = express();

app.use(express.static(path.resolve('frontend')));

app.use(express.json());

rotas(app);

export default app;