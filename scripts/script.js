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
      centralizarMapa(latitude, longitude, true, "Você está aqui", position.coords.accuracy);

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
// MAPA REAL (Leaflet + OpenStreetMap)
// ==========================================
// - Leaflet: biblioteca de mapas (já carregada no index.html).
// - OpenStreetMap: imagens do mapa, gratuito e sem chave de API.
// - Nominatim: transforma o endereço digitado em latitude/longitude.
// - Geolocalização do navegador (GPS): botão "Usar minha localização".

let mapaSpoty = null;        // objeto do mapa Leaflet
let marcadorSpoty = null;    // pino atual (busca ou localização)
let circuloPrecisao = null;  // círculo que mostra a precisão do GPS

// Centro padrão usado enquanto a localização real não é obtida
const CENTRO_PADRAO = { lat: -23.5505, lng: -46.6333 }; // São Paulo, SP

const ZOOM_PADRAO = 14;
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

  return dentroDoBrasil ? { lat, lng } : CENTRO_PADRAO;
}

// Cria o mapa dentro da div #mapaReal
function iniciarMapaReal(lat, lng) {
  const mapaEl = document.getElementById("mapaReal");

  if (!mapaEl) {
    return;
  }

  // Se o Leaflet não carregou (sem internet, por exemplo), avisa em vez de quebrar
  if (typeof L === "undefined") {
    mapaEl.textContent = "Não foi possível carregar o mapa agora.";
    return;
  }

  const coordenada = garantirCoordenadaNoBrasil(lat, lng);

  mapaSpoty = L.map(mapaEl, { zoomControl: true }).setView(
    [coordenada.lat, coordenada.lng],
    ZOOM_PADRAO
  );

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }).addTo(mapaSpoty);

  // Garante que o mapa preencha a área depois que a página terminar de montar
  setTimeout(function () {
    mapaSpoty.invalidateSize();
  }, 300);
}

// Move o mapa para uma coordenada (sempre dentro do Brasil) e coloca o pino.
// Se o ponto veio do GPS, também desenha o círculo de precisão.
function centralizarMapa(lat, lng, comAnimacao, textoPopup, precisaoEmMetros) {
  const coordenada = garantirCoordenadaNoBrasil(lat, lng);

  if (!mapaSpoty) {
    iniciarMapaReal(coordenada.lat, coordenada.lng);
  }

  if (!mapaSpoty) {
    return;
  }

  const posicao = [coordenada.lat, coordenada.lng];

  if (comAnimacao) {
    mapaSpoty.flyTo(posicao, ZOOM_PRECISO, { duration: 1.2 });
  } else {
    mapaSpoty.setView(posicao, ZOOM_PRECISO);
  }

  // Troca o pino antigo pelo novo
  if (marcadorSpoty) {
    marcadorSpoty.remove();
  }
  marcadorSpoty = L.marker(posicao).addTo(mapaSpoty);

  if (textoPopup) {
    // textContent evita que um endereço digitado vire código HTML
    const popup = document.createElement("span");
    popup.textContent = textoPopup;
    marcadorSpoty.bindPopup(popup).openPopup();
  }

  if (circuloPrecisao) {
    circuloPrecisao.remove();
    circuloPrecisao = null;
  }

  if (precisaoEmMetros) {
    circuloPrecisao = L.circle(posicao, {
      radius: precisaoEmMetros,
      color: "#1E6FEB",
      fillColor: "#1E6FEB",
      fillOpacity: 0.12,
      weight: 1
    }).addTo(mapaSpoty);
  }
}

// Converte um endereço digitado em coordenadas reais (Nominatim/OpenStreetMap).
function buscarCoordenadasEAtualizarMapa(endereco) {
  const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=" + encodeURIComponent(endereco);

  fetch(url, { headers: { "Accept-Language": "pt-BR" } })
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
