// ==========================================
// SPOTY - CARROSSEL DE DEPOIMENTOS
// ==========================================
// - Busca os depoimentos na tabela "feedbacks" do Supabase.
// - Mostra num carrossel que anda devagar para o lado (pausa ao passar o mouse).
// - Usuário logado pode publicar, editar ou excluir o PRÓPRIO depoimento.
// Tudo fica dentro de uma função para não conflitar com as variáveis
// dos outros scripts (script.js, sessao.js).

(function () {
  const trilho = document.getElementById("depoimentosTrilho");
  const carrossel = document.getElementById("depoimentosCarrossel");

  // Se a página não tiver o carrossel, não faz nada
  if (!trilho || !carrossel) {
    return;
  }

  // Velocidade do carrossel em pixels por segundo (menor = mais devagar)
  const VELOCIDADE_PX_POR_SEGUNDO = 45;
  // Espaço entre os cards (px) — o mesmo valor é usado no CSS via JS
  const ESPACO_ENTRE_CARDS = 24;

  // false = só aparecem depoimentos REAIS (escritos por usuários cadastrados).
  // true  = completa com depoimentos de exemplo (útil só para testar o visual).
  const USAR_EXEMPLOS = true;

  // Usado só quando USAR_EXEMPLOS = true: mínimo de cards no carrossel
  const MINIMO_DE_CARDS = 6;

  const DEPOIMENTOS_EXEMPLO = [
    { nome: "Marina Alves", cidade: "São Paulo, SP", nota: 5, mensagem: "Encontrei uma vaga em menos de um minuto, bem perto do meu trabalho." },
    { nome: "Rafael Souza", cidade: "Campinas, SP", nota: 5, mensagem: "O app é simples e me ajuda a economizar tempo todos os dias." },
    { nome: "Juliana Costa", cidade: "Santos, SP", nota: 5, mensagem: "Uso toda semana. É prático e nunca mais tive dor de cabeça pra estacionar." },
    { nome: "Carlos Mendes", cidade: "Osasco, SP", nota: 4, mensagem: "Pagar pelo app com PIX é muito rápido. Recomendo." },
    { nome: "Patrícia Lima", cidade: "Guarulhos, SP", nota: 5, mensagem: "Achei estacionamento perto do hospital sem precisar dar voltas." },
    { nome: "Bruno Tavares", cidade: "Santo André, SP", nota: 5, mensagem: "Reservei a vaga antes de sair de casa e cheguei tranquilo." }
  ];

  // Mesmo caminho dos botões "Entrar" do index.html
  const PAGINA_LOGIN = "html/login.html";

  let depoimentosAtuais = [];

  // ---------- Funções de apoio ----------

  function pegarIniciais(nome) {
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) {
      return partes[0].substring(0, 2).toUpperCase();
    }
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  }

  // "Marina Alves Souza" -> "Marina S." (protege a privacidade na página pública)
  function nomeParaExibir(nome) {
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) {
      return partes[0];
    }
    return partes[0] + " " + partes[partes.length - 1].charAt(0).toUpperCase() + ".";
  }

  function estrelas(nota) {
    return "★".repeat(nota) + "☆".repeat(5 - nota);
  }

  // Monta um card. Usa textContent (e não innerHTML) para que ninguém
  // consiga injetar código na página através de um depoimento.
  function criarCard(dep) {
    const card = document.createElement("article");
    card.className = "depoimento";

    const topo = document.createElement("div");
    topo.className = "depoimento-topo";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = pegarIniciais(dep.nome);

    const dados = document.createElement("div");
    const nome = document.createElement("strong");
    nome.textContent = nomeParaExibir(dep.nome);
    dados.appendChild(nome);

    if (dep.cidade) {
      const cidade = document.createElement("span");
      cidade.textContent = dep.cidade;
      dados.appendChild(cidade);
    }

    topo.appendChild(avatar);
    topo.appendChild(dados);

    const stars = document.createElement("div");
    stars.className = "stars";
    stars.setAttribute("aria-label", "Nota " + dep.nota + " de 5");
    stars.textContent = estrelas(dep.nota);

    const texto = document.createElement("p");
    texto.textContent = "\u201C" + dep.mensagem + "\u201D";

    card.appendChild(topo);
    card.appendChild(stars);
    card.appendChild(texto);

    return card;
  }

  // ---------- Carrossel (setas + troca automática) ----------

  const janela = carrossel.querySelector(".depoimentos-janela");
  const setaAnterior = document.getElementById("carrosselAnterior");
  const setaProximo = document.getElementById("carrosselProximo");

  let cardsReais = [];     // os depoimentos de verdade
  let clones = [];         // cópias do começo, coladas no fim para o loop não ter emenda
  let visiveis = 3;        // quantos cards cabem na tela agora
  let larguraCard = 0;
  let passo = 0;           // largura de um card + espaço
  let larguraLoop = 0;     // largura de uma volta completa (só os cards reais)
  let deslocamento = 0;    // quanto o trilho já andou (px)
  let impulso = 0;         // movimento extra pedido pelas setas / dedo (px)
  let mouseEmCima = false;
  let focoNoTeclado = false;
  let quadroId = null;
  let tempoAnterior = 0;

  function quantosCabem() {
    const largura = janela.clientWidth;
    if (largura >= 900) return 3;
    if (largura >= 580) return 2;
    return 1;
  }

  // Só há movimento quando existem mais depoimentos do que cabem na tela
  function precisaMover() {
    return cardsReais.length > visiveis;
  }

  function carrosselPausado() {
    return mouseEmCima || focoNoTeclado;
  }

  function aplicarPosicao() {
    trilho.style.transform = "translateX(" + (-Math.round(deslocamento)) + "px)";
  }

  // Roda ~60 vezes por segundo: anda continuamente, a não ser que o mouse esteja em cima
  function quadro(agora) {
    quadroId = requestAnimationFrame(quadro);

    const segundos = Math.min((agora - tempoAnterior) / 1000, 0.1);
    tempoAnterior = agora;

    let andar = 0;

    if (!carrosselPausado()) {
      andar += VELOCIDADE_PX_POR_SEGUNDO * segundos;
    }

    if (Math.abs(impulso) > 0.5) {
      const parte = impulso * (1 - Math.exp(-segundos * 8));
      impulso -= parte;
      andar += parte;
    } else if (impulso !== 0) {
      andar += impulso;
      impulso = 0;
    }

    if (andar !== 0) {
      deslocamento = ((deslocamento + andar) % larguraLoop + larguraLoop) % larguraLoop;
      aplicarPosicao();
    }
  }

  function iniciarMovimento() {
    if (quadroId !== null) return;
    tempoAnterior = performance.now();
    quadroId = requestAnimationFrame(quadro);
  }

  function pararMovimento() {
    if (quadroId !== null) {
      cancelAnimationFrame(quadroId);
      quadroId = null;
    }
  }

  // Calcula o tamanho dos cards conforme a largura da tela e monta as cópias do loop
  function ajustarCarrossel() {
    if (cardsReais.length === 0) {
      if (setaAnterior) setaAnterior.style.display = "none";
      if (setaProximo) setaProximo.style.display = "none";
      return;
    }

    visiveis = quantosCabem();
    larguraCard = Math.floor((janela.clientWidth - ESPACO_ENTRE_CARDS * (visiveis - 1)) / visiveis);
    passo = larguraCard + ESPACO_ENTRE_CARDS;
    larguraLoop = cardsReais.length * passo;

    clones.forEach(function (c) { c.remove(); });
    clones = [];

    const movimenta = precisaMover();

    if (movimenta) {
      const quantidade = Math.min(cardsReais.length, visiveis + 1);
      for (let i = 0; i < quantidade; i++) {
        const copia = cardsReais[i].cloneNode(true);
        copia.setAttribute("aria-hidden", "true");
        trilho.appendChild(copia);
        clones.push(copia);
      }
    }

    trilho.style.gap = ESPACO_ENTRE_CARDS + "px";
    cardsReais.concat(clones).forEach(function (card) {
      card.style.width = larguraCard + "px";
    });

    deslocamento = 0;
    impulso = 0;
    aplicarPosicao();

    if (movimenta) {
      if (setaAnterior) setaAnterior.style.display = "";
      if (setaProximo) setaProximo.style.display = "";
    } else {
      if (setaAnterior) setaAnterior.style.display = "none";
      if (setaProximo) setaProximo.style.display = "none";
    }

    setaAnterior.hidden = !movimenta;
    setaProximo.hidden = !movimenta;

    if (movimenta) {
      iniciarMovimento();
    } else {
      pararMovimento();
    }
  }

  setaProximo.addEventListener("click", function () {
    if (precisaMover()) impulso += passo;
  });

  setaAnterior.addEventListener("click", function () {
    if (precisaMover()) impulso -= passo;
  });

  carrossel.addEventListener("mouseenter", function () {
    mouseEmCima = true;
  });
  carrossel.addEventListener("mouseleave", function () {
    mouseEmCima = false;
  });

  carrossel.addEventListener("focusin", function (evento) {
    focoNoTeclado = evento.target.matches(":focus-visible");
  });
  carrossel.addEventListener("focusout", function () {
    focoNoTeclado = false;
  });

  let toqueInicialX = null;
  janela.addEventListener("touchstart", function (e) {
    toqueInicialX = e.touches[0].clientX;
  }, { passive: true });
  janela.addEventListener("touchend", function (e) {
    if (toqueInicialX === null) return;
    const diferenca = e.changedTouches[0].clientX - toqueInicialX;
    toqueInicialX = null;
    if (Math.abs(diferenca) < 40 || !precisaMover()) return;
    impulso += diferenca < 0 ? passo : -passo;
  });

  function montarCarrossel(lista) {
    pararMovimento();
    trilho.innerHTML = "";
    clones = [];
    cardsReais = [];
    deslocamento = 0;
    impulso = 0;

    const base = lista.slice();
    let i = 0;
    while (USAR_EXEMPLOS && base.length < MINIMO_DE_CARDS) {
      base.push(DEPOIMENTOS_EXEMPLO[i % DEPOIMENTOS_EXEMPLO.length]);
      i++;
    }

    // Ainda não há nenhum depoimento real (CORRIGIDO: Removido de dentro do loop while)
    if (base.length === 0) {
      const aviso = document.createElement("p");
      aviso.className = "depoimentos-vazio";
      aviso.textContent = "Ainda não há depoimentos. Seja o primeiro a contar como o Spoty ajuda você!";
      trilho.appendChild(aviso);
      trilho.style.transform = "none";
      trilho.style.width = "100%";
      if (setaAnterior) setaAnterior.style.display = "none";
      if (setaProximo) setaProximo.style.display = "none";
      setaAnterior.hidden = true;
      setaProximo.hidden = true;
      return;
    }
    base.forEach(function (dep) {
      trilho.appendChild(criarCard(dep));
    });
    cardsReais = Array.from(trilho.children);
    ajustarCarrossel();
  }
  async function carregarDepoimentos() {
    try {
      const { data, error } = await supabaseClient
        .from("feedbacks")
        .select("nome, cidade, nota, mensagem")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) {
        throw error;
      }
      depoimentosAtuais = data || [];
    } catch (erro) {
      console.error("Erro ao carregar depoimentos:", erro);
      depoimentosAtuais = [];
    }
    montarCarrossel(depoimentosAtuais);
  }
  let esperaRedimensionar = null;
  window.addEventListener("resize", function () {
    clearTimeout(esperaRedimensionar);
    esperaRedimensionar = setTimeout(ajustarCarrossel, 200);
  });
  // ---------- Formulário "Deixar meu depoimento" ----------
  const botaoAbrir = document.getElementById("feedbackAbrir");
  const form = document.getElementById("feedbackForm");
  const campoCidade = document.getElementById("feedbackCidade");
  const campoMensagem = document.getElementById("feedbackMensagem");
  const contador = document.getElementById("feedbackContador");
  const botaoCancelar = document.getElementById("feedbackCancelar");
  const botaoExcluir = document.getElementById("feedbackExcluir");
  const botoesNota = document.querySelectorAll(".feedback-nota button");
  let notaEscolhida = 0;
  let usuarioAtual = null;
  let jaTemDepoimento = false;
  function avisar(mensagem) {
    if (typeof mostrarToast === "function") {
      mostrarToast(mensagem);
    } else {
      alert(mensagem);
    }
  }
  function marcarNota(nota) {
    notaEscolhida = nota;
    botoesNota.forEach(function (botao) {
      const valor = Number(botao.dataset.nota);
      botao.classList.toggle("ativa", valor <= nota);
      botao.setAttribute("aria-checked", valor === nota ? "true" : "false");
    });
  }
  function atualizarContador() {
    contador.textContent = campoMensagem.value.length + "/280";
  }
  async function carregarMeuDepoimento() {
    jaTemDepoimento = false;
    if (!usuarioAtual) {
      return;
    }
    const { data } = await supabaseClient
      .from("feedbacks")
      .select("cidade, nota, mensagem")
      .eq("user_id", usuarioAtual.id)
      .maybeSingle();
    if (data) {
      jaTemDepoimento = true;
      campoCidade.value = data.cidade || "";
      campoMensagem.value = data.mensagem;
      marcarNota(data.nota);
      atualizarContador();
    }
    botaoAbrir.textContent = jaTemDepoimento ? "Editar meu depoimento" : "Deixar meu depoimento";
    botaoExcluir.hidden = !jaTemDepoimento;
  }
  async function atualizarEstadoDoUsuario() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    usuarioAtual = session ? session.user : null;
    if (!usuarioAtual) {
      form.hidden = true;
      form.reset();
      marcarNota(0);
      atualizarContador();
      botaoAbrir.textContent = "Entre para deixar seu depoimento";
      botaoExcluir.hidden = true;
      return;
    }
    await carregarMeuDepoimento();
  }
  if (botaoAbrir && form) {
    botaoAbrir.addEventListener("click", function () {
      if (!usuarioAtual) {
        window.location.href = PAGINA_LOGIN;
        return;
      }
      form.hidden = !form.hidden;
      if (!form.hidden) {
        campoMensagem.focus();
      }
    });
    botoesNota.forEach(function (botao) {
      botao.addEventListener("click", function () {
        marcarNota(Number(botao.dataset.nota));
      });
    });
    campoMensagem.addEventListener("input", atualizarContador);
    botaoCancelar.addEventListener("click", function () {
      form.hidden = true;
    });
    botaoExcluir.addEventListener("click", async function () {
      if (!usuarioAtual || !confirm("Excluir seu depoimento?")) {
        return;
      }
      const { error } = await supabaseClient
        .from("feedbacks")
        .delete()
        .eq("user_id", usuarioAtual.id);
      if (error) {
        avisar("Não foi possível excluir agora. Tente novamente.");
        return;
      }
      form.reset();
      marcarNota(0);
      atualizarContador();
      form.hidden = true;
      avisar("Depoimento excluído.");
      await atualizarEstadoDoUsuario();
      await carregarDepoimentos();
    });
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!usuarioAtual) {
        window.location.href = PAGINA_LOGIN;
        return;
      }
      const mensagem = campoMensagem.value.trim();
      const cidade = campoCidade.value.trim();
      if (notaEscolhida < 1) {
        avisar("Escolha uma nota de 1 a 5 estrelas.");
        return;
      }
      if (mensagem.length < 10) {
        avisar("Escreva pelo menos 10 caracteres no depoimento.");
        return;
      }
      const botaoPublicar = form.querySelector("button[type='submit']");
      if (botaoPublicar) botaoPublicar.disabled = true;
      const { error } = await supabaseClient
        .from("feedbacks")
        .upsert(
          {
            user_id: usuarioAtual.id,
            nota: notaEscolhida,
            mensagem: mensagem,
            cidade: cidade === "" ? null : cidade
          },
          { onConflict: "user_id" }
        );
      if (botaoPublicar) botaoPublicar.disabled = false;
      if (error) {
        console.error("Erro ao salvar depoimento:", error);
        avisar("Não foi possível publicar seu depoimento agora.");
        return;
      }
      avisar("Obrigado! Seu depoimento foi publicado.");
      form.hidden = true;
      await atualizarEstadoDoUsuario();
      await carregarDepoimentos();
    });
    supabaseClient.auth.onAuthStateChange(function () {
      setTimeout(atualizarEstadoDoUsuario, 0);
    });
    atualizarEstadoDoUsuario();
  }
  carregarDepoimentos();
})();
