# Spoty — Plataforma de Busca por Vagas de Estacionamento

O **Spoty** é um projeto acadêmico que busca facilitar a localização de vagas de estacionamento por meio de uma interface simples e intuitiva.

A proposta é aproximar motoristas e estabelecimentos que disponibilizam vagas, centralizando informações em uma única plataforma.

O projeto está em desenvolvimento e seu estado atual corresponde a um MVP (*Minimum Viable Product* — Produto Mínimo Viável).

## Objetivo do projeto

Desenvolver uma plataforma que simplifique a busca por vagas de estacionamento, oferecendo uma experiência acessível aos usuários e criando uma base para futuras funcionalidades de integração entre motoristas e estabelecimentos.

## Funcionalidades

- **Interface web:** páginas para navegação e apresentação da plataforma.
- **Cadastro e login:** telas de acesso para usuários.
- **Autenticação:** integração com Supabase Auth.
- **Gerenciamento de sessão:** scripts relacionados ao estado de autenticação.
- **Perfil do usuário:** interface para edição de informações pessoais.
- **Mapa interativo:** utilização da biblioteca Leaflet.
- **Busca por endereço:** integração com o serviço Nominatim.
- **Geolocalização:** suporte a recursos de localização do navegador.
- **Páginas institucionais:** informações e canal de contato.

### Funcionalidades em desenvolvimento

Alguns recursos ainda precisam de implementação, validação ou aprimoramento. A disponibilidade de vagas não representa dados confirmados em tempo real.

- Reservas de vagas.
- Pagamentos e assinaturas.
- Integração completa com estabelecimentos.
- Aplicativo mobile.
- Aprimoramento dos mecanismos de gestão de vagas.

## Tecnologias utilizadas

| Tecnologia | Finalidade |
|---|---|
| HTML5 | Estrutura das páginas |
| CSS3 | Estilização e identidade visual |
| JavaScript | Interatividade e lógica do front-end |
| Leaflet | Exibição do mapa interativo |
| OpenStreetMap / CARTO | Camadas cartográficas |
| Nominatim | Busca de endereços |
| Supabase Auth | Autenticação de usuários |
| PostgreSQL / Supabase | Infraestrutura de dados |

O front-end utiliza JavaScript puro, sem framework ou etapa de build própria. Até o momento, o projeto não possui uma API própria em Python.

## Estrutura do projeto

A pasta `scripts/` contém os arquivos JavaScript utilizados nas funcionalidades da aplicação:

```text
scripts/
├── cadastro.js
├── conectado.js
├── editar-informacoes.js
├── fale-conosco.js
├── login.js
├── paginas.js
├── script.js
├── sessao.js
└── supabaseClient.js
```

Os arquivos são utilizados em funcionalidades como cadastro, login, gerenciamento de sessão, edição de perfil, navegação e integração com o Supabase.

A lista acima representa apenas o conteúdo confirmado da pasta `scripts/`, e não a estrutura completa da raiz do repositório.

## Como executar localmente

### Pré-requisitos

- Git instalado.
- Navegador atualizado.
- Visual Studio Code ou outro editor de código.
- Um servidor local, como a extensão Live Server do VS Code.

### 1. Clonar o repositório

Abra o terminal e execute:

```bash
git clone https://github.com/GuilhermeLopesDeOliveira/Spoty.git
```

Entre na pasta do projeto:

```bash
cd Spoty
```

### 2. Abrir o projeto

Abra a pasta do projeto no Visual Studio Code.

Utilize um servidor local, como a extensão Live Server, para executar a aplicação no navegador. A abertura direta pelo protocolo `file://` pode impedir o funcionamento correto de alguns recursos.

### 3. Configurar o Supabase

As funcionalidades relacionadas à autenticação e aos dados dependem da configuração do projeto no Supabase.

Verifique as configurações necessárias nos arquivos responsáveis pela inicialização do cliente e pela autenticação antes de executar os fluxos que dependem desses serviços.

**Importante:** não publique chaves secretas, como `service_role`, nem credenciais privadas no repositório. As chaves utilizadas no navegador devem ter permissões adequadas, e as políticas de segurança do banco de dados precisam estar configuradas corretamente.

## Limitações conhecidas

- A disponibilidade de vagas não é atualizada em tempo real.
- Reservas e pagamentos ainda não estão implementados.
- O aplicativo mobile está planejado para uma etapa futura.
- A integração com estabelecimentos pode ser ampliada.
- Os termos de uso e a política de privacidade precisam de revisão antes de serem considerados documentos finais.
- A configuração do banco de dados e as políticas de acesso devem ser verificadas conforme a evolução do projeto.

Para consultar problemas conhecidos, prioridades e decisões técnicas, acesse o arquivo [BACKLOG.md](BACKLOG.md).

## Próximos passos

Entre as etapas previstas para a evolução do projeto estão:

1. Revisar e documentar a configuração do banco de dados.
2. Validar os fluxos de autenticação e edição de perfil.
3. Aprimorar a confiabilidade das funcionalidades existentes.
4. Evoluir a integração com estabelecimentos e a gestão de vagas.
5. Avaliar funcionalidades futuras, como reservas e aplicativo mobile.

Esses itens representam objetivos de evolução e não devem ser interpretados como funcionalidades já concluídas.

## Segurança e privacidade

O projeto deve seguir boas práticas de segurança, com proteção de credenciais, controle de acesso aos dados e revisão das informações pessoais coletadas.

Antes de uma utilização em produção, é necessário validar as políticas de acesso, os fluxos de autenticação e os documentos relacionados à privacidade.

## Contribuição

Sugestões, correções e melhorias podem ser discutidas por meio das issues e dos pull requests do repositório.

## Licença

Consulte o arquivo [LICENSE](LICENSE) para verificar os termos de utilização e distribuição do projeto.

## Repositório

[GitHub — Spoty](https://github.com/GuilhermeLopesDeOliveira/Spoty)

---

Desenvolvido como projeto acadêmico por sua equipe de desenvolvimento.
