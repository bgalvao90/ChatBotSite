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

  // NOVO estado para alternar visão geral pendentes
  const [mostrarPendentesTodosAtendentes, setMostrarPendentesTodosAtendentes] =
    useState(false);

  const itensPorPagina = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    let nomeUsuario = "Atendente";

    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      nomeUsuario =
        payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
        "Atendente";
      setUsuario({ nome: nomeUsuario });
    }
  }, []);

  useEffect(() => {
    if (usuario) carregarAtendimentos();
  }, [usuario, filtroStatus, filtroConteudo, mostrarPendentesTodosAtendentes]);

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

  async function carregarAtendimentos() {
    try {
      let endpoint = "";
      let params = {};

      if (filtroConteudo.trim() !== "") {
        // Se tem filtro por conteúdo, usa filtro geral
        endpoint = "/AtendimentoAtendente/filtro";
        params = { conteudo: filtroConteudo.trim() };
      } else if (mostrarPendentesTodosAtendentes) {
        // Buscar pendentes de todos os atendentes
        endpoint = "/AtendimentoAtendente/pendentes";
        // Ajuste esse endpoint conforme sua API real!
      } else {
        // Buscar só os próprios atendimentos conforme filtroStatus
        endpoint = "/AtendimentoAtendente/meus";
        if (filtroStatus === "pendente") {
          params.status = [1, 2];
        } else if (filtroStatus === "concluido") {
          params.status = 0;
        } else if (filtroStatus === "todos") {
          params.status = [0, 1, 2];
        }
      }

      const response = await api.get(endpoint, { params });
      setAtendimentos(response.data);
      setPaginaAtual(1);
    } catch (err) {
      console.error("Erro ao carregar atendimentos", err);
    }
  }

  async function assumirAtendimento(id) {
    try {
      await api.patch(`/AtendimentoAtendente/assumir/${id}`);
      alert("Atendimento assumido com sucesso!");
      carregarAtendimentos();
    } catch (error) {
      console.error("Erro ao assumir atendimento:", error);
      alert("Erro ao assumir atendimento.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
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
    <div className={`atendente-dashboard ${darkMode ? "dark-mode" : ""}`}>
      <header className="chat-header-dashboard">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={logoGruppy} alt="Gruppy" style={{ height: "40px" }} />
          <span style={{ fontWeight: "bold", fontSize: 18 }}>
            Bem-vindo, <strong>{usuario?.nome || "Atendente"}</strong>!
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

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn btn-success"
            onClick={() => navigate("/atendente/criar-atendimento")}
          >
            Novo Atendimento
          </button>

          {/* NOVO botão para alternar visão geral pendentes */}
          <button
            className={`btn ${
              mostrarPendentesTodosAtendentes
                ? "btn-primary"
                : "btn-outline-primary"
            }`}
            onClick={() =>
              setMostrarPendentesTodosAtendentes(
                !mostrarPendentesTodosAtendentes
              )
            }
            title="Mostrar pendentes de todos os atendentes"
          >
            {mostrarPendentesTodosAtendentes
              ? "Ver meus atendimentos"
              : "Ver todos pendentes"}
          </button>

          <button onClick={handleLogout} className="btn btn-danger">
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
            color: darkMode ? "#eee" : "#000",
          }}
        >
          <h2 style={{ margin: 0 }}>Atendimentos</h2>
          <select
            value={filtroStatus}
            onChange={(e) => {
              setFiltroStatus(e.target.value);
              setFiltroConteudo("");
            }}
            disabled={
              filtroConteudo.trim() !== "" || mostrarPendentesTodosAtendentes
            }
            style={{
              padding: 6,
              borderRadius: 4,
              border: "1px solid",
              borderColor: darkMode ? "#555" : "#ccc",
              minWidth: 140,
              backgroundColor: darkMode ? "#2a2a3f" : "#fff",
              color: darkMode ? "#eee" : "#000",
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
            disabled={mostrarPendentesTodosAtendentes}
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
          {filtroConteudo.trim() !== "" && !mostrarPendentesTodosAtendentes && (
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
                onClick={() => navigate(`/atendente/atendimento/${at.id}`)}
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
                  <p style={{ margin: "6px 0" }}>
                    <strong>Cliente:</strong> {at.nomeUsuario || "Desconhecido"}
                  </p>

                  {(at.status === 1 || at.status === 2) &&
                    (!at.atendente || at.atendente.nome !== usuario?.nome) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          assumirAtendimento(at.id);
                        }}
                        style={{
                          marginTop: 8,
                          padding: "6px 12px",
                          backgroundColor: "#007bff",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Assumir atendimento
                      </button>
                    )}
                </div>
                <div style={{ textAlign: "right", minWidth: 180 }}>
                  <p style={{ margin: "6px 0" }}>
                    <strong>Atendente:</strong> {at.atendente?.nome || "Nenhum"}
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
              position: "fixed",
              bottom: 20,
              right: 20,
              backgroundColor: darkMode ? "#1e1e2e" : "#fff",
              padding: "8px 12px",
              borderRadius: 8,
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              display: "flex",
              gap: 6,
              zIndex: 999,
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
