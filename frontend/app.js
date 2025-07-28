document.addEventListener("DOMContentLoaded", () => {
  const api = "";

  //Login
  const formLogin = document.getElementById("form-login");
  if (formLogin) {
    formLogin.addEventListener("submit", async e => {
      e.preventDefault();
      const email = formLogin.email.value;
      const senha = formLogin.senha.value;
      const resp = await fetch(api + "/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
      });
      if (!resp.ok) return alert("Falha no login");
      const { token } = await resp.json();
      localStorage.setItem("token", token);
      location.href = "/dashboard.html";
    });
  }

  //Cadastro
  const formCad = document.getElementById("form-cadastro");
  if (formCad) {
    formCad.addEventListener("submit", async e => {
      e.preventDefault();
      const nome  = formCad.nome.value;
      const email = formCad.email.value;
      const senha = formCad.senha.value;
      const resp = await fetch(api + "/usuarios/cadastrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha })
      });
      if (!resp.ok) return alert("Falha no cadastro");
      alert("Cadastro realizado!");
      location.href = "/login.html";
    });
  }

  //Dashboard
  const dash = document.getElementById("dashboard");
  if (dash) {
    const token = localStorage.getItem("token");
    if (!token) {
      location.href = "/login.html";
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };

    //Função que busca saldo e cotação
    async function atualiza() {
      // saldo
      const sRes = await fetch(api + "/carteira/saldo", { headers });
      if (!sRes.ok) {
        alert("Erro ao obter saldo");
        return;
      }
      const s = await sRes.json();
      document.getElementById("saldo-brl").textContent = s.saldoBRL.toFixed(2);
      document.getElementById("saldo-btc").textContent = s.saldoBTC.toFixed(8);

      // cotação
      const cRes = await fetch(api + "/btc/preco");
      if (!cRes.ok) {
        alert("Erro ao obter cotação");
        return;
      }
      const c = await cRes.json();
      document.getElementById("cotacao-compra").textContent = c.compra.toFixed(2);
      document.getElementById("cotacao-venda").textContent = c.venda.toFixed(2);
    }
    atualiza();

    //Depósito
    document.getElementById("form-deposito")
      .addEventListener("submit", async e => {
        e.preventDefault();
        const valor = parseFloat(e.target["deposito-valor"].value);
        const r = await fetch(api + "/carteira/deposito", {
          method: "POST",
          headers,
          body: JSON.stringify({ valor })
        });
        if (!r.ok) {
          alert("Erro no depósito");
          return;
        }
        alert(`Depósito de R$ ${valor.toFixed(2)} realizado!`);
        atualiza();
      });

    //Compra
    document.getElementById("form-compra")
      .addEventListener("submit", async e => {
        e.preventDefault();
        const valor = parseFloat(e.target["compra-valor"].value);
        const r = await fetch(api + "/btc/comprar", {
          method: "POST",
          headers,
          body: JSON.stringify({ valor })
        });
        if (!r.ok) {
          alert("Erro na compra");
          return;
        }
        alert(`Compra de R$ ${valor.toFixed(2)} realizada!`);
        atualiza();
      });

    //Venda
    document.getElementById("form-venda")
      .addEventListener("submit", async e => {
        e.preventDefault();
        const quantidade = parseFloat(e.target["venda-quantidade"].value);
        const r = await fetch(api + "/btc/vender", {
          method: "POST",
          headers,
          body: JSON.stringify({ quantidade })
        });
        if (!r.ok) {
          alert("Erro na venda");
          return;
        }
        alert(`Venda de ${quantidade.toFixed(8)} BTC realizada!`);
        atualiza();
      });

    //Logout
    document.getElementById("btn-logout")
      .addEventListener("click", () => {
        localStorage.removeItem("token");
        location.href = "/login.html";
      });
  }
});