const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("dados.db", (err) => {
  if (err) {
    console.error("Erro ao abrir o banco de dados:", err);
  } else {
    console.log("Banco de dados criado com sucesso!");
  }
});

const createTableQuery = `
    CREATE TABLE IF NOT EXISTS registros (
        ord INTEGER PRIMARY KEY,
        nome TEXT,
        funcao TEXT,
        tipo TEXT,
        ordem INTEGER,
        confirmado INTEGER,
        palanque INTEGER
    );
`;

db.run(createTableQuery, (err) => {
  if (err) {
    console.error("Erro ao criar a tabela:", err);
  } else {
    console.log("Tabela criada com sucesso!");
  }
});

const express = require("express");
const { jsPDF } = require("jspdf");

const app = express();
const port = 80;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  db.all("SELECT * FROM registros ORDER BY ordem ASC", (err, rows) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.render("index", { dados: rows });
  });
});

app.get("/convidado/:ord", (req, res) => {
  const { ord } = req.params;
  const query = "SELECT * FROM registros WHERE ord = ?";
  db.get(query, [ord], (err, row) => {
    if (err) {
      return res.status(500).send({ success: false, message: err.message });
    }
    if (!row) {
      return res
        .status(404)
        .send({ success: false, message: "Registro não encontrado!" });
    }
    res.status(200).send({ success: true, data: row });
  });
});

app.put("/editar/:ord", (req, res) => {
  const { ord } = req.params;
  const { nome, funcao, tipo } = req.body; // Pegando os dados do corpo da requisição

  // Verificar se os campos obrigatórios foram enviados
  if (!nome || !tipo) {
    return res
      .status(400)
      .send({ success: false, message: "Nome e Tipo são obrigatórios!" });
  }

  const query = `
    UPDATE registros
    SET nome = ?, funcao = ?, tipo = ?
    WHERE ord = ?
  `;

  db.run(query, [nome, funcao, tipo, ord], function (err) {
    if (err) {
      return res.status(500).send({ success: false, message: err.message });
    }
    if (this.changes === 0) {
      return res
        .status(404)
        .send({ success: false, message: "Registro não encontrado!" });
    }
    res
      .status(200)
      .send({ success: true, message: "Registro atualizado com sucesso!" });
  });
});

app.post("/novo", (req, res) => {
  const { ord, nome, funcao, tipo, ordem } = req.body;

  console.log(req.body);
  if (!nome || !tipo) {
    return res.status(400).send("Nome e tipo são obrigatórios!");
  }

  const query =
    "INSERT INTO registros (ord, nome, funcao, tipo, ordem) VALUES (?, ?, ?, ?, ?)";
  db.run(query, [ord, nome, funcao, tipo, ordem], function (err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    console.log(`Novo convidado inserido ${nome}`);
    res.redirect("/");
  });
});

app.put("/reordenar", (req, res) => {
  const { ordem } = req.body;

  if (!ordem || !Array.isArray(ordem)) {
    return res.status(400).send("Lista de ordem inválida.");
  }

  const queries = ordem.map((ord, index) => {
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE registros SET ordem = ? WHERE ord = ?",
        [index, ord],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });

  Promise.all(queries)
    .then(() => res.json({ message: "Ordem atualizada!" }))
    .catch((err) => res.status(500).send(err.message));
});

app.put("/confirmar/:ord", (req, res) => {
  const { ord } = req.params;

  // Atualizar a coluna 'confirmado' para 1
  const query = "UPDATE registros SET confirmado = 1 WHERE ord = ?";
  db.run(query, [ord], function (err) {
    if (err) {
      return res.status(500).send({ success: false, message: err.message });
    }
    if (this.changes === 0) {
      return res
        .status(404)
        .send({ success: false, message: "Registro não encontrado!" });
    }
    console.log(`Presença confirmada para o registro ${ord}`);
    res
      .status(200)
      .send({ success: true, message: "Presença confirmada com sucesso!" });
  });
});

app.put("/desconfirmar/:ord", (req, res) => {
  const { ord } = req.params;

  // Atualizar a coluna 'confirmado' para 1
  const query =
    "UPDATE registros SET confirmado = 0, palanque = 0 WHERE ord = ?";
  db.run(query, [ord], function (err) {
    if (err) {
      return res.status(500).send({ success: false, message: err.message });
    }
    if (this.changes === 0) {
      return res
        .status(404)
        .send({ success: false, message: "Registro não encontrado!" });
    }
    console.log(`Presença desconfirmada para o registro ${ord}`);
    res
      .status(200)
      .send({ success: true, message: "Presença desconfirmada com sucesso!" });
  });
});

app.put("/adicionar-palanque/:ord", (req, res) => {
  const { ord } = req.params;

  // Atualizar a coluna 'confirmado' para 1
  const query = "UPDATE registros SET palanque = 1 WHERE ord = ?";
  db.run(query, [ord], function (err) {
    if (err) {
      return res.status(500).send({ success: false, message: err.message });
    }
    if (this.changes === 0) {
      return res
        .status(404)
        .send({ success: false, message: "Registro não encontrado!" });
    }
    console.log(`Autoridade adicionada no palanque: ${ord}`);
    res
      .status(200)
      .send({ success: true, message: "Autoridade adicionada no palanque!" });
  });
});

app.put("/remover-palanque/:ord", (req, res) => {
  const { ord } = req.params;

  // Atualizar a coluna 'confirmado' para 1
  const query = "UPDATE registros SET palanque = 0 WHERE ord = ?";
  db.run(query, [ord], function (err) {
    if (err) {
      return res.status(500).send({ success: false, message: err.message });
    }
    if (this.changes === 0) {
      return res
        .status(404)
        .send({ success: false, message: "Registro não encontrado!" });
    }
    console.log(`Autoridade removida do palanque: ${ord}`);
    res
      .status(200)
      .send({ success: true, message: "Autoridade removida do palanque!" });
  });
});

app.delete("/apagar/:ord", (req, res) => {
  const { ord } = req.params;

  const query = "DELETE FROM registros WHERE ord = ?";
  db.run(query, [ord], function (err) {
    if (err) {
      console.log("erro brabo");
      return res.status(500).send(err.message);
    }
    if (this.changes === 0) {
      return res.status(404).send("Registro não encontrado!");
    }
    console.log(`Registro ${ord} apagado`);
    res.status(200).send({ message: "Registro apagado com sucesso!" });
  });
});

app.put("/limpar-confirmados", (req, res) => {
  const query =
    "UPDATE registros SET confirmado = 0, palanque = 0 WHERE confirmado = 1";

  db.run(query, function (err) {
    if (err) {
      console.log("Erro ao desconfirmar convidados:", err);
      return res.status(500).send(err.message);
    }
    if (this.changes === 0) {
      return res.status(404).send("Nenhum convidado estava confirmado!");
    }
    console.log(`Todos os convidados confirmados foram desconfirmados.`);
    res
      .status(200)
      .send({ message: "Todos os convidados foram desconfirmados!" });
  });
});

// Rota para gerar PDF organizado por categoria e com "Outros" no final
app.get("/convidados-confirmados", (req, res) => {
  db.all(
    "SELECT * FROM registros WHERE confirmado = 1 ORDER BY ordem ASC",
    (err, confirmados) => {
      if (err) {
        return res.status(500).send("Erro ao buscar dados do banco de dados");
      }

      const doc = new jsPDF();
      const margin = 10;
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;

      let y = margin + 10;
      let pageCount = 1;

      // Título Principal
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("RELAÇÃO DE PRESENÇA", pageWidth / 2, y, { align: "center" });
      doc.setFont("helvetica", "normal");
      y += 10;
      doc.text("CONVIDADOS CONFIRMADOS", pageWidth / 2, y, { align: "center" });
      y += 15;

      // **1. Categoria PALANQUE**
      const palanqueConvidados = confirmados
        .filter((c) => c.palanque === 1)
        .sort((a, b) => parseInt(a.ordem) - parseInt(b.ordem));

      if (palanqueConvidados.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("PALANQUE", pageWidth / 2, y, { align: "center" });
        y += 8;

        doc.setFontSize(9);
        palanqueConvidados.forEach((c) => {
          doc.setFont("helvetica", "bold");
          doc.text(c.nome, pageWidth / 2, y, { align: "center" });
          y += 4;

          if (c.funcao) {
            doc.setFont("helvetica", "normal");
            doc.text(`(${c.funcao})`, pageWidth / 2, y, { align: "center" });
            y += 8;
          }

          if (y > pageHeight - margin - 10) {
            doc.addPage();
            y = margin + 10;
            pageCount++;
          }
        });

        y += 10; // Espaço entre PALANQUE e demais categorias
      }

      // **2. Outras Categorias**
      const categorias = [...new Set(confirmados.map((c) => c.tipo))]
        .filter((c) => c !== "Outros")
        .concat(["Outros"]);

      categorias.forEach((tipo) => {
        const convidadosDaCategoria = confirmados
          .filter((c) => c.tipo === tipo && c.palanque !== 1) // Já mostramos os do palanque
          .sort((a, b) => parseInt(a.ordem) - parseInt(b.ordem));

        if (convidadosDaCategoria.length > 0) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text(`${tipo}`, pageWidth / 2, y, { align: "center" });
          y += 8;

          doc.setFontSize(9);
          convidadosDaCategoria.forEach((c) => {
            doc.setFont("helvetica", "bold");
            doc.text(c.nome, pageWidth / 2, y, { align: "center" });
            y += 4;

            if (c.funcao) {
              doc.setFont("helvetica", "normal");
              doc.text(`(${c.funcao})`, pageWidth / 2, y, { align: "center" });
              y += 8;
            }

            if (y > pageHeight - margin - 10) {
              doc.addPage();
              y = margin + 10;
              pageCount++;
            }
          });

          y += 5;
        }
      });

      // Salvar e enviar o PDF
      const pdfBlob = doc.output("blob");
      res.setHeader("Content-Type", "application/pdf");
      pdfBlob.arrayBuffer().then((buffer) => {
        res.send(Buffer.from(buffer));
      });
    }
  );
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
