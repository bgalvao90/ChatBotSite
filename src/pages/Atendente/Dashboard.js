import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./style.css";
import logoGruppy from "../../assets/logo.png";
import * as signalR from "@microsoft/signalr";

export default function Dashboard() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("pendente");
  const [statusAtendente, setStatusAtendente] = useState(0);
  const [filtroConteudo, setFiltroConteudo] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

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

      fetch("https://localhost:7169/api/Atendente/status?id=0", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Falha ao atualizar status");
          }
          return res.json();
        })
        .then((data) => {
          console.log("Status alterado para online:", data);
        })
        .catch((err) => {
          console.error(err);
        });

      const handleBeforeUnload = (event) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch("https://localhost:7169/api/Atendente/status?id=2", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          keepalive: true,
        });
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
    }
  }, []);

  useEffect(() => {
    if (usuario) carregarAtendimentos();
  }, [usuario, filtroStatus, filtroConteudo, mostrarPendentesTodosAtendentes]);

  function traduzirStatusAtendimentoPorNumero(status) {
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

  async function AlterarStatusAtendente(novoStatus) {
    const token = localStorage.getItem("token");
    if (!token) return;

    const statusEnumParaString = {
      0: "Online",
      1: "Ausente",
      2: "Offline",
    };

    const statusString = statusEnumParaString[novoStatus];
    if (!statusString) {
      console.error("Status inválido:", novoStatus);
      return;
    }

    try {
      const response = await fetch(
        `https://localhost:7169/api/Atendente/status?status=${statusString}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao atualizar status");
      }

      const data = await response.json();
      console.log(`Status alterado para: ${statusString}`, data);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
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

  async function handleLogout() {
    const token = localStorage.getItem("token");
    if (!token) return;

    await AlterarStatusAtendente(2);

    localStorage.removeItem("token");
    navigate("/");
  }

  function TempoDecorrido({ criadoEm, finalizadoEm }) {
    const [tempo, setTempo] = useState("");

    useEffect(() => {
      const inicio = new Date(criadoEm);
      const fim = finalizadoEm ? new Date(finalizadoEm) : null;

      // verifica se fim é uma data válida e posterior ao início
      const isFinalizadoValido =
        fim instanceof Date && !isNaN(fim) && fim.getTime() > inicio.getTime();

      if (isFinalizadoValido) {
        const diffMs = fim - inicio;
        const totalSegundos = Math.floor(diffMs / 1000);
        const horas = Math.floor(totalSegundos / 3600);
        const minutos = Math.floor((totalSegundos % 3600) / 60);
        const segundos = totalSegundos % 60;

        const formatado =
          horas > 0
            ? `${horas}h ${minutos}min ${segundos}s`
            : `${minutos}min ${segundos}s`;

        setTempo(formatado);
        return;
      }

      const intervalo = setInterval(() => {
        const agora = new Date();
        const diffMs = agora - inicio;

        const totalSegundos = Math.floor(diffMs / 1000);
        const horas = Math.floor(totalSegundos / 3600);
        const minutos = Math.floor((totalSegundos % 3600) / 60);
        const segundos = totalSegundos % 60;

        const formatado =
          horas > 0
            ? `${horas}h ${minutos}min ${segundos}s`
            : `${minutos}min ${segundos}s`;

        setTempo(formatado);
      }, 1000);

      return () => clearInterval(intervalo);
    }, [criadoEm, finalizadoEm]);

    return <span>{tempo}</span>;
  }

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7169/chatHub")
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => {
        console.log("Conectado ao SignalR");

        // Escuta o evento que o back envia
        connection.on("AtualizarDashboard", (dadosAtualizados) => {
          console.log("Dashboard atualizada:", dadosAtualizados);
          setAtendimentos(dadosAtualizados); // Atualiza a lista no front
        });
      })
      .catch((err) => console.error("Erro ao conectar:", err));
  }, []);

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
          <select
            value={statusAtendente}
            onChange={async (e) => {
              const novoStatus = Number(e.target.value);
              setStatusAtendente(novoStatus);
              await AlterarStatusAtendente(novoStatus);
            }}
            style={{
              padding: 6,
              borderRadius: 4,
              border: "1px solid",
              borderColor: darkMode ? "#555" : "#ccc",
              minWidth: 40,
              backgroundColor: darkMode ? "#2a2a3f" : "#fff",
              color: darkMode ? "#eee" : "#000",
            }}
          >
            <option value={0}>🟢 Online</option>
            <option value={1}>🟠 Ausente</option>
            <option value={2}>🔴 Offline</option>
          </select>
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
                    {traduzirStatusAtendimentoPorNumero(at.status)}
                  </p>
                  <p style={{ margin: "6px 0" }}>
                    <strong>Conteúdo:</strong> {at.titulo || "Nenhum"}
                  </p>
                  <p style={{ margin: "6px 0" }}>
                    <strong>Cliente:</strong> {at.nomeUsuario || "Desconhecido"}
                  </p>
                  <p style={{ margin: "6px 0" }}>
                    <strong>Categoria:</strong> {at.categoria || "Desconhecido"}
                  </p>
                  <p>
                    Tempo de Atendimento:{" "}
                    <TempoDecorrido
                      criadoEm={at.criadoEm}
                      finalizadoEm={at.finalizadoEm}
                    />
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
