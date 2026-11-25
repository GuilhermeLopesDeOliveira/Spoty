// ==========================================
// SPOTY - SESSÃO DO USUÁRIO (cabeçalho)
// ==========================================
// Esse arquivo decide o que aparece no cabeçalho:
// - Ninguém logado -> mostra os botões "Criar cadastro" e "Entrar".
// - Alguém logado  -> mostra o círculo com as iniciais e o menu do usuário.

// Pega as iniciais do nome para usar como "foto" do usuário
// Ex.: "Lucas Silva" -> "LS" | "Lucas" -> "LU"
function pegarIniciais(nome) {
  const partes = nome.trim().split(/\s+/);

  if (partes.length === 1) {
    return partes[0].substring(0, 2).toUpperCase();
  }

  const primeiraLetra = partes[0].charAt(0);
  const ultimaLetra = partes[partes.length - 1].charAt(0);

  return (primeiraLetra + ultimaLetra).toUpperCase();
}

// Descobre se o usuário é dono: só é dono quem tem uma linha na tabela "donos".
// Se a consulta falhar (ex.: tabela ainda não criada), trata como cliente.
async function usuarioEhDono(usuarioId) {
  const { data, error } = await supabaseClient
    .from("donos")
    .select("id")
    .eq("id", usuarioId)
    .maybeSingle();

  return !error && !!data;
}

// Mostra "Cliente" ou "Dono" no menu e ajusta o link:
// cliente -> "Quero ser dono" | dono -> "Meu painel de dono"
function atualizarMenuTipoConta(ehDono) {
  const selo = document.getElementById("dropdownTipo");
  const link = document.getElementById("menuDonoLink");

  if (selo) {
    selo.textContent = ehDono ? "Conta de dono" : "Conta de cliente";
    selo.hidden = false;
  }

  if (link) {
    link.textContent = ehDono ? "Meu painel de dono" : "Quero ser dono";
    const dentroDaPastaHtml = window.location.pathname.includes("/html/");
  const prefixoPaginas = dentroDaPastaHtml ? "" : "html/";
  link.setAttribute(
    "href",
    prefixoPaginas + (ehDono ? "painel-dono.html" : "virar-dono.html")
  );
    link.hidden = false;
  }
}

// Olha se existe alguém logado e troca o que aparece no cabeçalho
async function verificarSessao() {
  const areaDeslogado = document.getElementById("headerActionsDeslogado");
  const areaLogado = document.getElementById("userMenuLogado");

  // Se a página não tiver esse cabeçalho, não faz nada
  if (!areaDeslogado || !areaLogado) {
    return;
  }

  // Pergunta pro Supabase se tem alguém logado agora
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session) {
    // Busca o nome e e-mail do usuário logado na tabela profiles
    const { data: perfil } = await supabaseClient
      .from("profiles")
      .select("nome")
      .eq("id", session.user.id)
      .maybeSingle();

    const nome = perfil ? perfil.nome : session.user.email;
    const ehDono = await usuarioEhDono(session.user.id);

    areaDeslogado.style.display = "none";
    areaLogado.style.display = "block";

    const iniciais = pegarIniciais(nome);

    document.getElementById("avatarBotao").textContent = iniciais;
    document.getElementById("avatarGrande").textContent = iniciais;
    document.getElementById("dropdownNome").textContent = nome;
    document.getElementById("dropdownEmail").textContent = session.user.email;

    atualizarMenuTipoConta(ehDono);
  } else {
    areaDeslogado.style.display = "flex";
    areaLogado.style.display = "none";
  }
}

// ==========================================
// ABRIR / FECHAR O MENU DO USUÁRIO
// ==========================================

function alternarMenuUsuario() {
  document.getElementById("userDropdown").classList.toggle("aberto");
}

// Fecha o menu se o usuário clicar em qualquer lugar fora dele
document.addEventListener("click", function (event) {
  const menu = document.querySelector(".user-menu");
  const dropdown = document.getElementById("userDropdown");

  if (menu && dropdown && !menu.contains(event.target)) {
    dropdown.classList.remove("aberto");
  }
});

// ==========================================
// SAIR (LOGOUT)
// ==========================================

async function sair() {
  await supabaseClient.auth.signOut();

  mostrarToast("Você saiu da sua conta.");

  // Atualiza o cabeçalho na hora (sem precisar recarregar a página)
  verificarSessao();
}

// mostrarToast pode não existir em todas as páginas que usam sessao.js
function mostrarToast(mensagem) {
  const toast = document.getElementById("toast");
  if (!toast) {
    return;
  }
  toast.textContent = mensagem;
  toast.classList.add("show");
  setTimeout(function () {
    toast.classList.remove("show");
  }, 3000);
}

verificarSessao();
