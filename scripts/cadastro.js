const cadastroForm = document.getElementById("cadastroForm");
const senhaInput = document.getElementById("senha");
const confirmarSenhaInput = document.getElementById("confirmarSenha");
const telefoneInput = document.getElementById("telefone");
const toast = document.getElementById("toast");

// Mostrar ou ocultar uma senha (usada no campo "senha" e no "confirmarSenha")
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

// Deixa a primeira letra de cada nome maiúscula
// Ex.: "lucas silva PIRES" -> "Lucas Silva Pires"
function deixarIniciaisMaiusculas(nome) {
  const palavras = nome.trim().split(/\s+/);

  const palavrasFormatadas = palavras.map(function (palavra) {
    const primeiraLetra = palavra.charAt(0).toUpperCase();
    const restante = palavra.slice(1).toLowerCase();
    return primeiraLetra + restante;
  });

  return palavrasFormatadas.join(" ");
}

// Formatar telefone
if (telefoneInput) {
  telefoneInput.addEventListener("input", function () {
    let valor = telefoneInput.value.replace(/\D/g, "");

    if (valor.length > 11) {
      valor = valor.slice(0, 11);
    }

    if (valor.length > 10) {
      valor = valor.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (valor.length > 6) {
      valor = valor.replace(/(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
    } else if (valor.length > 2) {
      valor = valor.replace(/(\d{2})(\d+)/, "($1) $2");
    } else if (valor.length > 0) {
      valor = valor.replace(/(\d+)/, "($1");
    }

    telefoneInput.value = valor;
  });
}

// ==========================================
// TIPO DE CONTA (cliente ou dono)
// ==========================================

// Devolve "cliente" ou "dono", conforme a opção marcada no formulário
function pegarTipoConta() {
  const marcada = document.querySelector('input[name="tipoConta"]:checked');
  return marcada ? marcada.value : "cliente";
}

// Se a pessoa chegou por um link como cadastro.html?tipo=dono
// (por exemplo, vindo da página "Para empresas"), já deixa "Dono" marcado
function marcarTipoContaPelaUrl() {
  const tipoDaUrl = new URLSearchParams(window.location.search).get("tipo");

  if (tipoDaUrl !== "dono") {
    return;
  }

  const opcaoDono = document.querySelector('input[name="tipoConta"][value="dono"]');
  if (opcaoDono) {
    opcaoDono.checked = true;
  }

  // Quem já tem conta e clicar em "Entrar" volta para completar o cadastro de dono
  const linkLogin = document.getElementById("linkLogin");
  if (linkLogin) {
    linkLogin.href = "login.html?voltar=virar-dono.html";
  }
}

marcarTipoContaPelaUrl();

// Enviar cadastro
if (cadastroForm) {
  cadastroForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const nomeDigitado = document.getElementById("nome").value.trim();
    const usuario = document.getElementById("usuario").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefone = telefoneInput.value.trim();
    const senha = senhaInput.value;
    const confirmarSenha = confirmarSenhaInput.value;
    const tipoConta = pegarTipoConta();

    // Validações (iguais a antes)
    if (nomeDigitado === "") {
      mostrarToast("Digite seu nome completo.");
      return;
    }

    if (usuario === "") {
      mostrarToast("Escolha um nome de usuário.");
      return;
    }

    if (email === "") {
      mostrarToast("Digite seu e-mail.");
      return;
    }

    if (telefone === "") {
      mostrarToast("Digite seu telefone.");
      return;
    }

    if (senha.length < 6) {
      mostrarToast("Sua senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      mostrarToast("As senhas não são iguais.");
      confirmarSenhaInput.focus();
      return;
    }

    // Deixa o nome com a primeira letra de cada palavra maiúscula
    const nome = deixarIniciaisMaiusculas(nomeDigitado);

    // Desativa o botão pra pessoa não clicar duas vezes enquanto espera
    const botaoEnviar = cadastroForm.querySelector(".cadastro-btn");
    if (botaoEnviar) botaoEnviar.disabled = true;

    // 1) Cria o usuário no Supabase Auth (isso cuida de e-mail + senha)
    // O tipo escolhido vai junto como "intenção" do usuário (options.data).
    // Quem manda de verdade é a tabela "donos": só é dono quem tem uma linha lá.
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: senha,
      options: {
        data: { tipo_conta: tipoConta }
      }
    });

    if (error) {
      // Mensagens mais comuns, traduzidas
      if (error.message.includes("already registered")) {
        mostrarToast("Esse e-mail já possui uma conta. Faça login.");
      } else {
        mostrarToast("Não foi possível criar sua conta: " + error.message);
      }
      if (botaoEnviar) botaoEnviar.disabled = false;
      return;
    }

    // 2) Salva os dados extras (nome, usuário, telefone) na tabela profiles
    const novoUsuarioId = data.user.id;

    const { error: erroPerfil } = await supabaseClient
      .from("profiles")
      .insert({
        id: novoUsuarioId,
        nome: nome,
        usuario: usuario,
        telefone: telefone
      });

    if (erroPerfil) {
      if (erroPerfil.message.includes("duplicate") || erroPerfil.code === "23505") {
        mostrarToast("Esse nome de usuário já está em uso.");
      } else {
        mostrarToast("Sua conta foi criada, mas houve um erro ao salvar seus dados.");
      }
      if (botaoEnviar) botaoEnviar.disabled = false;
      return;
    }

    // Se o Supabase já entregou uma sessão (cadastro sem confirmação de e-mail),
    // o dono segue direto para registrar o estabelecimento.
    // Sem sessão (ex.: precisa confirmar o e-mail), ele passa pelo login e,
    // ao entrar, o login.js o leva para essa mesma tela.
    const temSessao = !!data.session;
    let destino = "login.html";

    if (tipoConta === "dono" && temSessao) {
      destino = "virar-dono.html";
      mostrarToast(`Conta criada, ${nome}! Agora cadastre o seu estabelecimento.`);
    } else if (tipoConta === "dono") {
      mostrarToast(`Conta criada, ${nome}! Faça login para cadastrar o seu estabelecimento.`);
    } else {
      mostrarToast(`Conta criada com sucesso! Agora faça login, ${nome}.`);
    }

    cadastroForm.reset();

    setTimeout(function () {
      window.location.href = destino;
    }, 1400);
  });
}

// Mostrar mensagem
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

// Remove a cortina assim que a página estiver visível
// (inclui volta pelo botão do navegador, que não dispara DOMContentLoaded)
window.addEventListener("pageshow", function () {
  if (pageTransition) {
    requestAnimationFrame(function () {
      pageTransition.classList.remove("active");
    });
  }
});
