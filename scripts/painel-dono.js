// ==========================================
// SPOTY - PAINEL DO DONO
// ==========================================
// O cabeçalho (avatar, menu, "Sair") é montado pelo sessao.js, que também
// já traz a função mostrarToast. Este arquivo só protege a página e
// mostra os dados do dono.
//
// Regras de acesso:
// - Ninguém logado        -> login.html
// - Logado, mas é cliente -> virar-dono.html (para fazer o upgrade)
// - Logado e é dono       -> mostra o painel

async function carregarPainel() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = "login.html";
    return;
  }

  const { data: dono, error } = await supabaseClient
    .from("donos")
    .select("tipo_documento, documento, nome_fantasia, criado_em")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar o painel:", error);
    mostrarToast("Não foi possível carregar o painel agora.");
    return;
  }

  // É cliente: leva para o formulário de upgrade
  if (!dono) {
    window.location.href = "virar-dono.html";
    return;
  }

  const rotulo = dono.tipo_documento === "cnpj" ? "CNPJ" : "CPF";

  // Mostra só o final do documento, para não expor o número inteiro na tela
  const finalDocumento = dono.documento.slice(-4);

  document.getElementById("painelTitulo").textContent = dono.nome_fantasia;
  document.getElementById("painelNomeFantasia").textContent = dono.nome_fantasia;
  document.getElementById("painelDocumentoRotulo").textContent = rotulo;
  document.getElementById("painelDocumento").textContent = "•••• " + finalDocumento;

  if (dono.criado_em) {
    document.getElementById("painelDesde").textContent =
      new Date(dono.criado_em).toLocaleDateString("pt-BR");
  }
}

carregarPainel();

// Se a pessoa clicar em "Sair" (ou a sessão acabar), sai do painel também
supabaseClient.auth.onAuthStateChange(function (evento) {
  if (evento === "SIGNED_OUT") {
    window.location.href = "login.html";
  }
});

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
