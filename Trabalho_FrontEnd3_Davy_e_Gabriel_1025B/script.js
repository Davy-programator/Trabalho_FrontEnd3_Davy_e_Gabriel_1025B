
const botao = document.getElementById("btn-buscar");
const input = document.getElementById("personagem-input");
const card = document.getElementById("card");
const erro = document.getElementById("erro");
const historicoTabela = document.getElementById("historico");

let historico =
    JSON.parse(localStorage.getItem("historicoRick")) || [];

renderizarHistorico();

botao.addEventListener("click", buscarPersonagem);

async function buscarPersonagem() {

    const nome = input.value.trim();

    if (nome === "") {
        return;
    }

    try {

        erro.textContent = "";

        const resposta =
            await fetch(`https://rickandmortyapi.com/api/character/?name=${nome}`);

        const dados = await resposta.json();

        const personagem = dados.results[0];

        mostrarCard(personagem);

        salvarHistorico(personagem);

    } catch {

        card.innerHTML = "";

        erro.textContent =
            "Personagem não encontrado!";
    }
}

function mostrarCard(personagem) {

    card.innerHTML = `
        <img src="${personagem.image}">
        <h2>${personagem.name}</h2>

        <p><strong>Status:</strong>
        ${personagem.status}</p>

        <p><strong>Espécie:</strong>
        ${personagem.species}</p>

        <p><strong>Gênero:</strong>
        ${personagem.gender}</p>

        <p><strong>Origem:</strong>
        ${personagem.origin.name}</p>
    `;
}

function salvarHistorico(personagem) {

    const existe =
        historico.some(item => item.id === personagem.id);

    if (existe) return;

    historico.push({
        id: personagem.id,
        nome: personagem.name,
        status: personagem.status
    });

    localStorage.setItem(
        "historicoRick",
        JSON.stringify(historico)
    );

    renderizarHistorico();
}

function renderizarHistorico() {

    historicoTabela.innerHTML = "";

    historico.forEach(personagem => {

        historicoTabela.innerHTML += `
            <tr>
                <td>${personagem.nome}</td>
                <td>${personagem.status}</td>
                <td>
                    <button
                    class="excluir"
                    onclick="remover(${personagem.id})">
                    X
                    </button>
                </td>
            </tr>
        `;
    });
}

function remover(id) {

    historico =
        historico.filter(
            personagem => personagem.id !== id
        );

    localStorage.setItem(
        "historicoRick",
        JSON.stringify(historico)
    );

    renderizarHistorico();
}