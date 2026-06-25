/* TESTES USANDO IA, somente para fins de aprendizado, depois retirarei. Davy aqui.*/
import fs from 'fs/promises'; // Mantido caso use em builds Node, mas no browser roda nativo.

// ========================================================
// 📦 SERVIÇO 1: PERSISTÊNCIA MÚLTIPLA (localStorage)
// ========================================================
const storageService = {
    // Busca a lista completa de contas cadastradas
    obterTodosUsuarios() {
        const dados = localStorage.getItem('banco_usuarios_trunfo');
        return dados ? JSON.parse(dados) : [];
    },

    // Salva ou atualiza um usuário na lista do banco
    salvarUsuario(usuarioData) {
        const lista = this.obterTodosUsuarios();
        // Verifica se o usuário já existe na lista para atualizá-lo, senão adiciona
        const index = lista.findIndex(u => u.nome.toLowerCase() === usuarioData.nome.toLowerCase());
        
        if (index !== -1) {
            lista[index] = usuarioData; // Atualiza conta existente (ex: quando escolhe o card)
        } else {
            lista.push(usuarioData); // Insere nova conta
        }
        
        localStorage.setItem('banco_usuarios_trunfo', JSON.stringify(lista));
    },

    // Busca um usuário específico pelo nome
    buscarUsuario(nome) {
        const lista = this.obterTodosUsuarios();
        return lista.find(u => u.nome.toLowerCase() === nome.toLowerCase()) || null;
    }
};

// ========================================================
// 🌐 SERVIÇO 2: CONSUMO DE API (fetch)
// ========================================================
const apiService = {
    async buscarPorGenero(genero) {
        try {
            const paginaAleatoria = Math.floor(Math.random() * 10) + 1;
            const resposta = await fetch(`https://rickandmortyapi.com/api/character/?gender=${genero}&page=${paginaAleatoria}`);
            if (!resposta.ok) throw new Error("Erro de conexão com a API.");
            const dados = await resposta.json();
            const indiceAleatorio = Math.floor(Math.random() * dados.results.length);
            return dados.results[indiceAleatorio];
        } catch (erro) {
            console.error(erro);
            return null;
        }
    }
};

// ========================================================
// 🖥️ SERVIÇO 3: GERENCIADOR DE INTERFACE (DOM)
// ========================================================
const uiService = {
    mudarTela(idDaTelaAtiva) {
        document.getElementById('tela-cadastro').classList.add('hidden');
        document.getElementById('tela-selecao').classList.add('hidden');
        document.getElementById('tela-perfil').classList.add('hidden');
        document.getElementById(idDaTelaAtiva).classList.remove('hidden');
    },

    criarTemplateCard(personagem, nomeDono, classeGenero) {
        return `
            <div class="super-trunfo-card ${classeGenero}" data-id="${personagem.id}" data-name="${personagem.name}" data-img="${personagem.image}">
                <div class="card-dono">${nomeDono}</div>
                <img src="${personagem.image}" alt="${personagem.name}" class="card-imagem">
                <div class="card-nome-char">${personagem.name}</div>
                <div class="card-status">Espécie: <span>${personagem.species}</span></div>
                <div class="card-status">Origem: <span>${personagem.origin.name}</span></div>
                <div class="card-status">Status Vital: <span>${personagem.status}</span></div>
            </div>
        `;
    }
};

// ========================================================
// 🚀 CONTROLLER PRINCIPAL
// ========================================================
function inicializarSistema() {
    const formCadastro = document.getElementById('form-cadastro');
    const containerCards = document.getElementById('cards-container');
    const containerPerfil = document.getElementById('card-escolhido-container');
    
    const btnVoltarCadastro = document.getElementById('btn-voltar-cadastro');
    const btnLogout = document.getElementById('btn-logout');

    let usuarioSessaoAtiva = null; // Guarda quem está logado no momento atual

    // 1. FLUXO: Submeter Formulário (Entrar ou Cadastrar)
    formCadastro.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const nome = document.getElementById('nome').value.trim();
        const senha = document.getElementById('senha').value;

        // Tenta achar o usuário no banco local
        const usuarioExistente = storageService.buscarUsuario(nome);

        if (usuarioExistente) {
            // CASO 1: Usuário já existe -> Valida a senha
            if (usuarioExistente.senha !== senha) {
                alert("❌ Senha incorreta para este Nick!");
                return;
            }
            
            usuarioSessaoAtiva = usuarioExistente;

            // Se ele já tiver uma carta escolhida, vai direto pro Perfil
            if (usuarioSessaoAtiva.cardEscolhido) {
                renderizarPerfilFinal(usuarioSessaoAtiva);
                return;
            }
        } else {
            // CASO 2: Usuário não existe -> Cria uma nova conta vazia
            usuarioSessaoAtiva = { nome, senha, cardEscolhido: null };
            storageService.salvarUsuario(usuarioSessaoAtiva);
        }

        // Se o usuário logou/cadastrou mas NÃO tem card, abre a tela de seleção
        await carregarOpcoesDeCards(usuarioSessaoAtiva.nome);
    });

    // 2. FLUXO: Buscar dados da API e exibir para escolha
    async function carregarOpcoesDeCards(nomeJogador) {
        uiService.mudarTela('tela-selecao');
        containerCards.innerHTML = '<p class="carregando">Buscando personagens na API cósmica...</p>';

        const [charMasculino, charFeminino] = await Promise.all([
            apiService.buscarPorGenero('male'),
            apiService.buscarPorGenero('female')
        ]);

        containerCards.innerHTML = '';

        if (charMasculino) containerCards.innerHTML += uiService.criarTemplateCard(charMasculino, nomeJogador, 'male');
        if (charFeminino) containerCards.innerHTML += uiService.criarTemplateCard(charFeminino, nomeJogador, 'female');

        configurarCliqueDeEscolha();
    }

    // 3. FLUXO: Capturar o clique da carta escolhida
    function configurarCliqueDeEscolha() {
        const cards = document.querySelectorAll('.super-trunfo-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                // Preenche o card na sessão ativa
                usuarioSessaoAtiva.cardEscolhido = {
                    classeGenero: card.classList.contains('female') ? 'female' : 'male',
                    htmlInterno: card.innerHTML
                };

                // Grava a atualização de forma persistente no localStorage
                storageService.salvarUsuario(usuarioSessaoAtiva);
                renderizarPerfilFinal(usuarioSessaoAtiva);
            });
        });
    }

    // 4. FLUXO: Mostrar tela final do Perfil
    function renderizarPerfilFinal(usuario) {
        uiService.mudarTela('tela-perfil');
        containerPerfil.innerHTML = `
            <div class="super-trunfo-card ${usuario.cardEscolhido.classeGenero}" style="cursor: default; margin: 0 auto;">
                ${usuario.cardEscolhido.htmlInterno}
            </div>
        `;
    }

    // 5. BOTÃO: Voltar da seleção para a tela de login (sem apagar os dados do banco)
    btnVoltarCadastro.addEventListener('click', () => {
        usuarioSessaoAtiva = null;
        formCadastro.reset();
        uiService.mudarTela('tela-cadastro');
    });

    // 6. BOTÃO: Logout da tela de perfil (sai da conta atual para permitir outro login)
    btnLogout.addEventListener('click', () => {
        usuarioSessaoAtiva = null;
        formCadastro.reset();
        uiService.mudarTela('tela-cadastro');
    });
}

inicializarSistema();