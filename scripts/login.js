// ==========================================
// SPOTY - TELA DE LOGIN
// ==========================================

const loginForm = document.getElementById("loginForm");
const emailLogin = document.getElementById("identificadorLogin");
const senhaLogin = document.getElementById("senhaLogin");
const toast = document.getElementById("toast");

// ==========================================
// MOSTRAR OU OCULTAR A SENHA
// ==========================================

function alternarVisibilidadeSenha(idDoCampo, botao) {
  const campo = document.getElementById(idDoCampo);

  if (campo.type === "password") {
    campo.type = "text";
    botao.textContent = "Ocultar";
  } else {
    campo.type = "password";
    botao.textContent = "Mostrar";
  }
}

// ==========================================
// PARA ONDE IR DEPOIS DO LOGIN
// ==========================================
// - Veio de um link com ?voltar=virar-dono.html -> volta para lá.
// - Escolheu "Dono" no cadastro mas ainda não preencheu os dados -> virar-dono.html.
// - Qualquer outro caso -> tela inicial.

async function descobrirDestinoAposLogin(usuario) {
  const voltar = new URLSearchParams(window.location.search).get("voltar");

  // Só aceita destinos conhecidos (evita redirecionar para qualquer endereço)
  if (voltar === "virar-dono.html") {
    return voltar;
  }

  const queriaSerDono = usuario && usuario.user_metadata && usuario.user_metadata.tipo_conta === "dono";

  if (queriaSerDono) {
    const { data: dono, error } = await supabaseClient
      .from("donos")
      .select("id")
      .eq("id", usuario.id)
      .maybeSingle();

    // Se deu erro (ex.: tabela ainda não criada), segue para a tela inicial
    if (!error && !dono) {
      return "virar-dono.html";
    }
  }

  return "../index.html";
}

// ==========================================
// ENTRAR
// ==========================================

if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = emailLogin.value.trim();
    const senha = senhaLogin.value;

    if (email === "") {
      mostrarToast("Digite seu e-mail.");
      return;
    }

    if (senha === "") {
      mostrarToast("Digite sua senha.");
      return;
    }

    const botaoEntrar = loginForm.querySelector(".cadastro-btn");
    if (botaoEntrar) botaoEntrar.disabled = true;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: senha
    });

    if (error) {
      mostrarToast("E-mail ou senha incorretos.");
      if (botaoEntrar) botaoEntrar.disabled = false;
      return;
    }

    mostrarToast("Login realizado! Entrando...");

    const destino = await descobrirDestinoAposLogin(data.user);

    setTimeout(function () {
      window.location.href = destino;
    }, 900);
  });
}

// ==========================================
// MENSAGEM (TOAST)
// ==========================================

function mostrarToast(mensagem) {
  if (!toast) {
    alert(mensagem);
    return;
  }

  toast.textContent = mensagem;
  toast.classList.add("show");

  setTimeout(function () {
    toast.classList.remove("show");
  }, 3000);
}

// ==========================================
// TRANSIÇÃO ENTRE PÁGINAS
// ==========================================

const pageTransition = document.querySelector(".page-transition");

function transicaoPagina(event, destino) {
  event.preventDefault();

  if (!pageTransition) {
    window.location.href = destino;
    return;
  }

  pageTransition.classList.add("active");

  setTimeout(function () {
    window.location.href = destino;
  }, 420);
}

window.addEventListener("pageshow", function () {
  if (pageTransition) {
    requestAnimationFrame(function () {
      pageTransition.classList.remove("active");
    });
  }
});
