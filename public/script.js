document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search");
  const lista = document.getElementById("results");
  const nome = document.getElementById("nome");
  const funcao = document.getElementById("funcao");

  [nome, funcao].forEach(function (element) {
    element.addEventListener("input", function () {
      this.value = this.value.toUpperCase();
    });
  });

  new Sortable(lista, {
    animation: 150,
    ghostClass: "dragging",
    onEnd: function (evt) {
      const items = [...lista.children].map((li) => li.dataset.id);
      atualizarOrdemNoServidor(items);
    },
  });

  searchInput.oninput = () => {
    searchInput.value = searchInput.value.toUpperCase();
  };
});

function apagarRegistro(ord) {
  const modal = document.getElementById("confirmModal");
  const confirmButton = document.getElementById("confirmDelete");
  const cancelButton = document.getElementById("cancelDelete");
  const modalMessage = document.getElementById("modalMessage");

  // Atualiza a mensagem do modal com o ID correto
  modalMessage.textContent = `Tem certeza que deseja apagar ${ord} este registro?`;

  // Exibe o modal
  modal.style.display = "flex";

  // Se o usuário confirmar
  confirmButton.onclick = function () {
    fetch(`/apagar/${ord}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        location.reload();
      })
      .catch((error) => console.error("Erro:", error));

    modal.style.display = "none";
  };

  // Se o usuário cancelar
  cancelButton.onclick = function () {
    modal.style.display = "none";
  };
}

// Fecha o modal se o usuário clicar fora dele
window.onclick = function (event) {
  const modal = document.getElementById("confirmModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

function editarRegistro(ord) {
  fetch(`/convidado/${ord}`) // Buscar dados antes de editar
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (!data) {
        alert("Registro não encontrado!");
        return;
      }

      const nome = document.getElementById("editNome");
      const funcao = document.getElementById("editFuncao");
      const tipo = document.getElementById("editTipo");

      // Preencher os campos do modal com os dados do registro
      nome.value = data.data.nome;
      funcao.value = data.data.funcao;
      tipo.value = data.data.tipo;

      // Abrir modal de edição
      document.getElementById("editModal").style.display = "block";

      // Atualizar o evento de submit do formulário
      const form = document.getElementById("editForm");
      form.onsubmit = function (e) {
        e.preventDefault(); // Evita reload da página

        fetch(`/editar/${ord}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: nome.value,
            funcao: funcao.value,
            tipo: tipo.value,
          }),
        })
          .then((response) => {
            if (response.ok) {
              window.location.reload(); // Atualiza a página após salvar
            } else {
              alert("Erro ao atualizar registro!");
            }
          })
          .catch((error) => console.error("Erro:", error));
      };
    })
    .catch((error) => console.error("Erro ao buscar registro:", error));
}

function atualizarOrdemNoServidor(novaOrdem) {
  fetch("/reordenar", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ordem: novaOrdem }),
  })
    .then((response) => response.json())
    .then((data) => console.log("Ordem salva:", data))
    .catch((error) => console.error("Erro ao atualizar ordem:", error));
  window.location.reload();
}

function confirmarPresenca(ord) {
  fetch(`/confirmar/${ord}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        setTimeout(() => {
          location.reload(); // Atualiza a página após a animação
        }, 500);
      } else {
        alert("Erro ao confirmar presença.");
      }
    })
    .catch((error) => console.error("Erro:", error));
}

function desconfirmarPresenca(ord) {
  fetch(`/desconfirmar/${ord}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        location.reload(); // Recarregar a página para atualizar a lista
      } else {
        alert("Erro ao desconfirmar presença!");
      }
    })
    .catch((error) => console.error("Erro:", error));
}

function limparConfirmados() {
  const sure = confirm("tem certeza?");
  fetch(`/limpar-confirmados`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  })
    .then(() => {
      if (success) {
        message("Desconfirmado com sucesso!");
      } else {
        alert("Erro ao desconfirmar presença!");
      }
    })
    .catch((error) => console.error("Erro:", error));
  location.reload(); // Recarregar a página para atualizar a lista
}

function alternarPalanque(ord) {
  const botao = document.querySelector(`li[data-id='${ord}'] .palanque`);
  if (!botao) {
    console.error(`Botão não encontrado para ord: ${ord}`);
    return;
  }

  const statusAtual = botao.getAttribute("data-status") === "1";

  if (statusAtual) {
    removerPalanque(ord, botao);
    window.location.reload();
  } else {
    adicionarPalanque(ord, botao);
    window.location.reload();
  }
}

function adicionarPalanque(ord, botao) {
  fetch(`/adicionar-palanque/${ord}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log("data success");
      } else {
        alert("Erro ao adicionar no palanque.");
      }
    })
    .catch((error) => console.error("Erro:", error));
}

function removerPalanque(ord, botao) {
  fetch(`/remover-palanque/${ord}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log("data sucess");
      } else {
        alert("Erro ao remover do palanque.");
      }
    })
    .catch((error) => console.error("Erro:", error));
}

function fecharModal() {
  document.getElementById("editModal").style.display = "none";
}
