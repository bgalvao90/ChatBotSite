import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./style.css";
import logoGruppy from "../../assets/logo.png";

export default function Dashboard() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("pendente");
  const [filtroConteudo, setFiltroConteudo] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const itensPorPagina = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    let nomeUsuario = "Cliente";

    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      nomeUsuario =
        payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
        "Cliente";
      setUsuario({ nome: nomeUsuario });
    }
  }, []);

  useEffect(() => {
    if (!usuario) return;

    async function carregarAtendimentos() {
      try {
        let endpoint = "/AtendimentoCliente/meus";
        let params = {};

        if (filtroConteudo.trim() !== "") {
          endpoint = "/AtendimentoCliente/filtro";
          params = { conteudo: filtroConteudo.trim() };
        } else {
          if (filtroStatus === "pendente") {
            endpoint = "/AtendimentoCliente/pendentes";
          } else if (filtroStatus === "concluido") {
            endpoint = "/AtendimentoCliente/meus";
            params.status = 0;
          } else if (filtroStatus === "todos") {
            endpoint = "/AtendimentoCliente/meus";
          }
        }

        const response = await api.get(endpoint, { params });
        setAtendimentos(response.data);
        setPaginaAtual(1);
      } catch (err) {
        console.error("Erro ao carregar atendimentos", err);
      }
    }

    carregarAtendimentos();
  }, [usuario, filtroStatus, filtroConteudo]);

  function traduzirStatusPorNumero(status) {
    switch (status) {
      case 0:
        return "Concluído";
      case 1:
        return "Em andamento";
      case 2:
        return "Iniciado";
      default:
        return "Desconhecido";
    }
  }
  function handleLogout() {
    localStorage.removeItem("token"); // Remove o token
    navigate("/"); // Redireciona para página de login (mude se necessário)
  }
  const atendimentosOrdenados = [...atendimentos].sort((a, b) => {
    if (a.posicaoNaFila == null) return 1;
    if (b.posicaoNaFila == null) return -1;
    return a.posicaoNaFila - b.posicaoNaFila;
  });

  const atendimentosFiltrados = atendimentosOrdenados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const totalPaginas = Math.ceil(atendimentos.length / itensPorPagina);

  return (
    <div className={`cliente-dashboard ${darkMode ? "dark-mode" : ""}`}>
      <header className="chat-header-dashboard">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={logoGruppy} alt="Gruppy" style={{ height: "40px" }} />
          <span style={{ fontWeight: "bold", fontSize: 18 }}>
            Bem-vindo, <strong>{usuario?.nome || "Cliente"}</strong>!
          </span>
          <button
            onClick={() => {
              const novoModo = !darkMode;
              setDarkMode(novoModo);
              localStorage.setItem("darkMode", novoModo); // salva preferência
            }}
            className="icon-button"
            title="Alternar tema"
            style={{
              marginLeft: "auto",
              fontSize: 20,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: darkMode ? "#fff" : "#333",
            }}
          >
            <i className={darkMode ? "bi bi-moon-fill" : "bi bi-sun-fill"}></i>
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: 10 }}>
          <button
            className="btn btn-success"
            onClick={() => navigate("/cliente/criar-atendimento")}
          >
            Novo Atendimento
          </button>

          {/* Botão Logout */}
          <button
            onClick={handleLogout}
            className="btn btn-danger"
            title="Sair"
          >
            Logout
          </button>
        </div>
      </header>

      <main>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
            flexWrap: "wrap",
            gap: "10px",
            color: darkMode ? "#eee" : "#000", // cor do texto
          }}
        >
          <h2 style={{ margin: 0 }}>Atendimentos</h2>
          <select
            value={filtroStatus}
            onChange={(e) => {
              setFiltroStatus(e.target.value);
              setFiltroConteudo("");
            }}
            disabled={filtroConteudo.trim() !== ""}
            style={{
              padding: 6,
              borderRadius: 4,
              border: "1px solid",
              borderColor: darkMode ? "#555" : "#ccc", // borda diferente no dark mode
              minWidth: 140,
              backgroundColor: darkMode ? "#2a2a3f" : "#fff", // fundo select
              color: darkMode ? "#eee" : "#000", // texto select
            }}
          >
            <option value="pendente">Pendentes</option>
            <option value="concluido">Concluídos</option>
            <option value="todos">Todos</option>
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: "bold" }}>
            Buscar por conteúdo nas mensagens:
          </label>
          <input
            type="text"
            value={filtroConteudo}
            onChange={(e) => setFiltroConteudo(e.target.value)}
            placeholder="Digite CNPJ, texto, etc..."
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              borderRadius: 4,
              border: "1px solid #ccc",
              backgroundColor: darkMode ? "#222" : "#fff",
              color: darkMode ? "#eee" : "#000",
            }}
          />
          {filtroConteudo.trim() !== "" && (
            <small style={{ color: "#666" }}>
              O filtro por status está desabilitado enquanto pesquisa por
              conteúdo.
            </small>
          )}
        </div>

        {atendimentosFiltrados.length === 0 ? (
          <p>Você ainda não possui atendimentos.</p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {atendimentosFiltrados.map((at) => (
              <div
                key={at.id}
                className="card-atendimento"
                onClick={() => navigate(`/cliente/atendimento/${at.id}`)}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px",
                  borderRadius: 8,
                  backgroundColor: darkMode ? "#2a2a3f" : "#fff",
                  boxShadow: darkMode
                    ? "0 2px 8px rgba(0,0,0,0.8)"
                    : "0 2px 8px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = darkMode
                    ? "#242435ff"
                    : "#f5f5f5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = darkMode
                    ? "#2a2a3f"
                    : "#fff")
                }
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>
                    #{at.id} - {at.titulo || "Sem título"}
                  </h3>
                  <p style={{ margin: "6px 0" }}>
                    <strong>Status:</strong>{" "}
                    {traduzirStatusPorNumero(at.status)}
                  </p>
                  <p style={{ margin: "6px 0" }}>
                    <strong>Conteúdo:</strong> {at.titulo || "Nenhum"}
                  </p>
                </div>
                <div style={{ textAlign: "right", minWidth: 180 }}>
                  <p style={{ margin: "6px 0" }}>
                    <strong>Atendente:</strong>{" "}
                    {at.atendente ? at.atendente.nome : "Nenhum"}
                  </p>
                  <p
                    style={{
                      fontSize: "0.9em",
                      color: darkMode ? "#bbb" : "#555",
                    }}
                  >
                    Posição na fila: {at.posicaoNaFila ?? "–"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPaginas > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "20px",
              paddingRight: "20px",
              gap: "6px",
            }}
          >
            {Array.from({ length: totalPaginas }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPaginaAtual(i + 1)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: "none",
                  fontSize: 14,
                  fontWeight: "bold",
                  cursor: "pointer",
                  backgroundColor:
                    paginaAtual === i + 1
                      ? "#0d6efd"
                      : darkMode
                      ? "#444"
                      : "#ddd",
                  color:
                    paginaAtual === i + 1 ? "#fff" : darkMode ? "#eee" : "#333",
                  transition: "background-color 0.3s",
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
