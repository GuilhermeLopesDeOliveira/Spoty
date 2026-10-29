// ==========================================
// SPOTY - SCRIPT PRINCIPAL
// ==========================================

// ==========================================
// ELEMENTOS DO HTML
// ==========================================

const searchInput = document.getElementById("searchInput");
const toast = document.getElementById("toast");

// ==========================================
// ROLAR ATÉ A ÁREA DE BUSCA
// ==========================================

function scrollToSearch() {
  const vagasSection = document.getElementById("vagas");

  if (vagasSection) {
    vagasSection.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  // Coloca o cursor no campo de pesquisa
  if (searchInput) {
    setTimeout(() => {
      searchInput.focus();
    }, 500);
  }
}

// ==========================================
// BUSCAR VAGAS
// ==========================================

function buscarVagas() {
  // Verifica se o campo existe
  if (!searchInput) {
    console.error("Campo de busca não encontrado.");
    return;
  }

  const endereco = searchInput.value.trim();

  // Verifica se o usuário digitou alguma coisa
  if (endereco === "") {
    mostrarToast("Digite um endereço ou região para buscar.");
    searchInput.focus();
    return;
  }

  mostrarToast(`Buscando vagas próximas de ${endereco}...`);

  // Busca as coordenadas do endereço digitado e atualiza o mapa real
  buscarCoordenadasEAtualizarMapa(endereco);
}

// ==========================================
// USAR LOCALIZAÇÃO
// ==========================================

function usarLocalizacao() {
  // Verifica se o navegador suporta geolocalização
  if (!navigator.geolocation) {
    mostrarToast("Seu navegador não suporta geolocalização.");
    return;
  }

  mostrarToast("Obtendo sua localização...");

  // Solicita localização
  navigator.geolocation.getCurrentPosition(

    // Localização encontrada
    function (position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);

      // Recentraliza o mapa real na localização do usuário
      centralizarMapa(latitude, longitude, true, "Você está aqui");

      mostrarToast("Localização encontrada!");
    },

    // Erro de localização
    function (error) {
      console.error("Erro ao obter localização:", error);

      switch (error.code) {
        case error.PERMISSION_DENIED:
          mostrarToast("Permissão de localização negada.");
          break;

        case error.POSITION_UNAVAILABLE:
          mostrarToast("Não foi possível obter sua localização.");
          break;

        case error.TIMEOUT:
          mostrarToast("Tempo limite para obter localização.");
          break;

        default:
          mostrarToast("Erro ao obter sua localização.");
          break;
      }
    },

    // Configurações da localização
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// ==========================================
// MAPA REAL (Waze Live Map, via iFrame)
// ==========================================

let mapaSpoty = null; // iframe do Waze dentro de #mapaReal

// Centro padrão usado enquanto a localização real não é obtida
const CENTRO_PADRAO = { lat: -23.5505, lng: -46.6333 }; // São Paulo, SP

// Zoom do Waze vai de 3 a 17 (17 é o mais próximo)
const ZOOM_PADRAO = 15;
const ZOOM_PRECISO = 17;

// Limites aproximados do território brasileiro
const LIMITES_BRASIL = {
  sul: -34.0,
  oeste: -74.5,
  norte: 5.5,
  leste: -32.0
};

// Garante que a coordenada usada fique dentro do Brasil; senão, usa o centro padrão
function garantirCoordenadaNoBrasil(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
    return CENTRO_PADRAO;
  }

  const dentroDoBrasil =
    lat >= LIMITES_BRASIL.sul && lat <= LIMITES_BRASIL.norte &&
    lng >= LIMITES_BRASIL.oeste && lng <= LIMITES_BRASIL.leste;

  if (!dentroDoBrasil) {
    return CENTRO_PADRAO;
  }

  return { lat, lng };
}

// Monta a URL do Live Map do Waze para uma coordenada (pin=1 coloca um pino no centro)
function montarUrlWaze(lat, lng, zoom) {
  return "https://embed.waze.com/iframe?zoom=" + zoom +
    "&lat=" + lat +
    "&lon=" + lng +
    "&pin=1";
}

// Cria o iframe do Waze dentro da área do mapa
function iniciarMapaReal(lat, lng) {
  const mapaEl = document.getElementById("mapaReal");

  if (!mapaEl) {
    return;
  }

  const coordenada = garantirCoordenadaNoBrasil(lat, lng);

  mapaSpoty = document.createElement("iframe");
  mapaSpoty.title = "Mapa Waze com vagas próximas";
  // Tamanho definido aqui para o iframe sempre preencher a área do mapa (sem depender do CSS)
  mapaSpoty.width = "100%";
  mapaSpoty.height = "100%";
  mapaSpoty.style.cssText = "display:block;width:100%;height:100%;border:0;";
  mapaSpoty.loading = "lazy";
  mapaSpoty.referrerPolicy = "no-referrer-when-downgrade";
  mapaSpoty.src = montarUrlWaze(coordenada.lat, coordenada.lng, ZOOM_PADRAO);

  mapaEl.innerHTML = "";
  mapaEl.appendChild(mapaSpoty);
}

// Move o mapa para uma coordenada (sempre dentro do Brasil) e coloca o pino no centro.
// O parâmetro "textoPopup" foi mantido só para não quebrar quem chama esta função;
// o iFrame do Waze não permite popup personalizado.
function centralizarMapa(lat, lng, comAnimacao, textoPopup) {
  const coordenada = garantirCoordenadaNoBrasil(lat, lng);

  if (!mapaSpoty) {
    iniciarMapaReal(coordenada.lat, coordenada.lng);
    return;
  }

  mapaSpoty.src = montarUrlWaze(coordenada.lat, coordenada.lng, ZOOM_PRECISO);
}

// Converte um endereço digitado em coordenadas reais (Nominatim/OpenStreetMap).
// O iFrame do Waze não tem busca de endereço por parâmetro, então continuamos
// usando o Nominatim só para descobrir a latitude/longitude.
function buscarCoordenadasEAtualizarMapa(endereco) {
  const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=" + encodeURIComponent(endereco);

  fetch(url)
    .then(function (resposta) {
      return resposta.json();
    })
    .then(function (dados) {
      if (!dados || dados.length === 0) {
        mostrarToast("Não encontramos esse endereço. Tente ser mais específico.");
        return;
      }

      const lat = parseFloat(dados[0].lat);
      const lng = parseFloat(dados[0].lon);
      centralizarMapa(lat, lng, true, endereco);

      mostrarToast(`Mapa centralizado em ${endereco}.`);
    })
    .catch(function (erro) {
      console.error("Erro ao buscar endereço:", erro);
      mostrarToast("Não foi possível buscar esse endereço agora.");
    });
}

// Ao carregar a página, o mapa abre no local padrão (São Paulo).
// A localização real só é pedida quando o usuário clica em
// "Usar minha localização" (função usarLocalizacao, mais acima).
function iniciarLocalizacaoDoMapa() {
  const mapaEl = document.getElementById("mapaReal");

  if (!mapaEl) {
    return;
  }

  iniciarMapaReal(CENTRO_PADRAO.lat, CENTRO_PADRAO.lng);
}

iniciarLocalizacaoDoMapa();

// ==========================================
// SISTEMA DE TOAST
// ==========================================

function mostrarToast(mensagem) {
  // Se o elemento toast não existir, usa alert como alternativa
  if (!toast) {
    alert(mensagem);
    return;
  }

  // Define o texto
  toast.textContent = mensagem;

  // Adiciona a classe "show"
  toast.classList.add("show");

  // Remove depois de 3 segundos
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ==========================================
// BUSCAR AO PRESSIONAR ENTER
// ==========================================

if (searchInput) {
  searchInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      buscarVagas();
    }
  });
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

// ==========================================
// INICIALIZAÇÃO
// ==========================================

// ==========================================
// ROLAGEM SUAVE AO ABRIR COM UMA ÂNCORA
// ==========================================
// Quando o link "Buscar vagas / Depoimentos / Como funciona" é clicado
// em OUTRA página (ex.: cadastro.html), o navegador abre o index.html
// e pula direto para a seção, sem animação. Esta função corrige isso:
// a página começa no topo e rola suavemente até a seção certa.

function rolarParaAncoraInicial() {
  if (!window.location.hash) {
    return;
  }

  const secaoAlvo = document.querySelector(window.location.hash);

  if (!secaoAlvo) {
    return;
  }

  // Começa do topo (desfaz o "pulo" instantâneo do navegador)
  window.scrollTo(0, 0);

  // Espera a cortina de transição entre páginas sumir antes de rolar
  setTimeout(function () {
    secaoAlvo.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 450);
}

window.addEventListener("load", rolarParaAncoraInicial);

console.log("Spoty carregado com sucesso!");
