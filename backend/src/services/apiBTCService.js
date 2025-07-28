import axios from "axios";

export async function obterCotacao() {
  const resp = await axios.get("https://www.mercadobitcoin.net/api/BTC/ticker/");
  const ticker = resp.data.ticker;
  return { compra: Number(ticker.buy), venda: Number(ticker.sell) };
}

