// ==========================================
// SPOTY - VIRAR DONO (upgrade de cliente para dono)
// ==========================================
// A conta continua a MESMA (mesmo e-mail, mesmo id). Virar dono é só
// criar uma linha na tabela "donos" com o mesmo id do usuário.
// Quem tem uma linha em "donos" é dono; quem não tem é cliente.

const donoForm = document.getElementById("donoForm");
const documentoInput = document.getElementById("documento");
const documentoRotulo = document.getElementById("documentoRotulo");
const nomeEstabelecimentoInput = document.getElementById("nomeEstabelecimento");
const toast = document.getElementById("toast");

let usuarioId = null;

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function apenasNumeros(texto) {
  return texto.replace(/\D/g, "");
}

// Tira espaços sobrando do começo, do fim e do meio do nome
// (não muda maiúsculas, para respeitar nomes como "BH Park")
function arrumarNomeEstabelecimento(nome) {
  return nome.trim().replace(/\s+/g, " ");
}

// 12345678901 -> 123.456.789-01
function formatarCpf(numeros) {
  return numeros
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

// 12345678000195 -> 12.345.678/0001-95
function formatarCnpj(numeros) {
  return numeros
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

// Confere os dígitos verificadores do CPF (rejeita também 111.111.111-11 etc.)
function cpfValido(cpf) {
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false;
  }

  for (let tamanho = 9; tamanho < 11; tamanho++) {
    let soma = 0;

    for (let i = 0; i < tamanho; i++) {
      soma += Number(cpf[i]) * (tamanho + 1 - i);
    }

    const digito = ((soma * 10) % 11) % 10;

    if (digito !== Number(cpf[tamanho])) {
      return false;
    }
  }

  return true;
}

// Confere os dígitos verificadores do CNPJ
function cnpjValido(cnpj) {
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6].concat(pesos1);

  function calcularDigito(base, pesos) {
    let soma = 0;

    for (let i = 0; i < pesos.length; i++) {
      soma += Number(base[i]) * pesos[i];
    }

    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  return (
    calcularDigito(cnpj, pesos1) === Number(cnpj[12]) &&
    calcularDigito(cnpj, pesos2) === Number(cnpj[13])
  );
}

function pegarTipoDocumento() {
  const marcado = document.querySelector('input[name="tipoDocumento"]:checked');
  return marcado ? marcado.value : "cpf";
}

// ==========================================
// CAMPO DE DOCUMENTO (CPF ou CNPJ)
// ==========================================

function atualizarCampoDocumento() {
  const tipo = pegarTipoDocumento();
  const numeros = apenasNumeros(documentoInput.value);

  if (tipo === "cpf") {
    documentoRotulo.textContent = "CPF";
    documentoInput.placeholder = "000.000.000-00";
    documentoInput.value = formatarCpf(numeros);
  } else {
    documentoRotulo.textContent = "CNPJ";
    documentoInput.placeholder = "00.000.000/0000-00";
    documentoInput.value = formatarCnpj(numeros);
  }
}

documentoInput.addEventListener("input", atualizarCampoDocumento);

document.querySelectorAll('input[name="tipoDocumento"]').forEach(function (opcao) {
  opcao.addEventListener("change", atualizarCampoDocumento);
});

// ==========================================
// PROTEGE A PÁGINA: precisa estar logado e ainda não ser dono
// ==========================================

async function iniciarPagina() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  // Ninguém logado: leva para o cadastro já com "Dono" marcado
  if (!session) {
    window.location.href = "cadastro.html?tipo=dono";
    return;
  }

  usuarioId = session.user.id;

  // Quem já é dono não precisa fazer o upgrade de novo
  const { data: dono } = await supabaseClient
    .from("donos")
    .select("id")
    .eq("id", usuarioId)
    .maybeSingle();

  if (dono) {
    window.location.href = "painel-dono.html";
    return;
  }

  // Quem escolheu "Dono" no cadastro está no último passo: registrar o estabelecimento.
  // Quem era cliente e clicou em "Quero ser dono" vê a versão de upgrade.
  const meta = session.user.user_metadata;
  if (meta && meta.tipo_conta === "dono") {
    document.getElementById("donoEyebrow").textContent = "Último passo";
    document.getElementById("donoTitulo").textContent = "Cadastre seu estabelecimento";
    document.getElementById("donoDica").textContent =
      "Sua conta já foi criada. Falta só informar os dados do seu estacionamento.";
    document.getElementById("donoBotao").textContent = "Concluir cadastro";
  }
}

iniciarPagina();

// ==========================================
// SALVAR (virar dono)
// ==========================================

if (donoForm) {
  donoForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const tipoDocumento = pegarTipoDocumento();
    const documento = apenasNumeros(documentoInput.value);
    const nomeEstabelecimento = arrumarNomeEstabelecimento(nomeEstabelecimentoInput.value);

    if (!usuarioId) {
      mostrarToast("Entre na sua conta para continuar.");
      return;
    }

    if (tipoDocumento === "cpf" && !cpfValido(documento)) {
      mostrarToast("Digite um CPF válido.");
      documentoInput.focus();
      return;
    }

    if (tipoDocumento === "cnpj" && !cnpjValido(documento)) {
      mostrarToast("Digite um CNPJ válido.");
      documentoInput.focus();
      return;
    }

    if (nomeEstabelecimento === "") {
      mostrarToast("Digite o nome do estabelecimento.");
      nomeEstabelecimentoInput.focus();
      return;
    }

    const botaoEnviar = donoForm.querySelector(".cadastro-btn");
    if (botaoEnviar) botaoEnviar.disabled = true;

    // O id da linha em "donos" é o MESMO id do usuário (auth.users.id = profiles.id)
    const { error } = await supabaseClient
      .from("donos")
      .insert({
        id: usuarioId,
        tipo_documento: tipoDocumento,
        documento: documento,
        nome_fantasia: nomeEstabelecimento
      });

    if (error) {
      console.error("Erro ao virar dono:", error);

      if (error.code === "23505") {
        mostrarToast("Esse documento já está cadastrado ou sua conta já é de dono.");
      } else if (error.code === "PGRST205" || error.code === "42P01") {
        // Tabela "donos" ainda não existe no Supabase
        mostrarToast("O cadastro de donos ainda não está disponível. Tente mais tarde.");
      } else {
        mostrarToast("Não foi possível concluir. Tente novamente.");
      }

      if (botaoEnviar) botaoEnviar.disabled = false;
      return;
    }

    mostrarToast("Pronto! Agora a sua conta também é de dono.");

    setTimeout(function () {
      window.location.href = "painel-dono.html";
    }, 1200);
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
