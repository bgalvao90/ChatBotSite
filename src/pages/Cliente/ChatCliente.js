import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as signalR from "@microsoft/signalr";
import api from "../../services/api";
import "./style.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [digitandoPor, setDigitandoPor] = useState(null);
  const [atendimento, setAtendimento] = useState(null);

  const messagesEndRef = useRef(null);
  const connectionRef = useRef(null);

  // Aplicar/remover classe dark-mode no body para modo escuro global
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  // Carregar mensagens e atendimento
  useEffect(() => {
    async function carregarDados() {
      try {
        const [resMensagens, resAtendimento] = await Promise.all([
          api.get(`/AtendimentoCliente/${id}/mensagens`),
          api.get(`/AtendimentoCliente/${id}`),
        ]);
        setMessages(resMensagens.data);
        setStatus(resAtendimento.data.status);
        setAtendimento(resAtendimento.data);
      } catch (err) {
        console.error("Erro ao buscar dados do atendimento", err);
      }
    }
    carregarDados();
  }, [id]);

  // Scroll automático para última mensagem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Setup SignalR
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7169/chatHub")
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => {
        console.log("Conectado ao SignalR");
        connection.invoke("EntrarNoGrupo", id);
      })
      .catch((err) => console.error("Erro ao conectar SignalR: ", err));

    connection.on("NovaMensagem", (mensagem) => {
      setMessages((prev) => [...prev, mensagem]);
    });

    connection.on("UsuarioDigitando", (nome) => {
      setDigitandoPor(nome);
      setTimeout(() => setDigitandoPor(null), 2000);
    });

    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, [id]);

  // Enviar mensagem
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !file) return;

    setIsSending(true);
    try {
      if (file) {
        const formData = new FormData();
        formData.append("Imagem", file);
        formData.append("Conteudo", input);
        formData.append("DataHora", new Date().toISOString());

        await api.post(`/AtendimentoCliente/${id}/anexo`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post(`/AtendimentoCliente/${id}/responder`, {
          Conteudo: input,
          DataHora: new Date().toISOString(),
        });
      }
      setInput("");
      setFile(null);
    } catch (err) {
      console.error("Erro ao enviar mensagem", err);
    } finally {
      setIsSending(false);
    }
  };

  // Finalizar atendimento
  const finalizarAtendimento = async () => {
    try {
      await api.patch(`/AtendimentoCliente/Finalizar-Atendimento/${id}`);
      alert("Atendimento finalizado.");
      setStatus(0);
      setMenuOpen(false);
    } catch (err) {
      console.error("Erro ao finalizar atendimento", err);
      alert("Erro ao finalizar.");
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => navigate("/cliente/dashboard")}
            className="icon-button"
            title="Voltar"
          >
            <i className="bi bi-box-arrow-left"></i>
          </button>
          <span>
            <strong>Atendente:</strong>{" "}
            {atendimento?.atendente?.nome || "Nenhum"}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            position: "relative",
          }}
        >
          <button
            onClick={() => {
              const novoModo = !darkMode;
              setDarkMode(novoModo);
              localStorage.setItem("darkMode", novoModo); // salva preferência
            }}
            className="icon-button"
            title={darkMode ? "Modo claro" : "Modo escuro"}
          >
            <i className={darkMode ? "bi bi-moon-fill" : "bi bi-sun-fill"}></i>
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="icon-button"
            title="Mais opções"
          >
            <i className="bi bi-three-dots-vertical"></i>
          </button>

          {menuOpen && (
            <div
              className="menu-dropdown"
              style={{ position: "absolute", right: 0, top: "120%" }}
            >
              <button
                onClick={async () => {
                  await finalizarAtendimento();
                  navigate("/cliente/dashboard");
                }}
                className="btn btn-danger"
              >
                Finalizar atendimento
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="chat-box">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${
              msg.enviadaPorAtendente ? "cliente" : "atendente"
            }`}
          >
            <strong>{msg.enviadoPor}</strong>:<br />
            {msg.conteudo}
            {msg.imagemUrl && (
              <div style={{ marginTop: 5 }}>
                {msg.imagemUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                  <img
                    src={`https://localhost:7169${msg.imagemUrl}`}
                    alt="anexo"
                    style={{ maxWidth: "100%", borderRadius: 6 }}
                  />
                ) : (
                  <a
                    href={`https://localhost:7169${msg.imagemUrl}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver anexo
                  </a>
                )}
              </div>
            )}
            <div
              style={{
                fontSize: "0.7em",
                color: msg.enviadaPorAtendente ? "#e9ecef" : "#e9ecef",
                marginTop: 4,
              }}
            >
              {new Date(msg.dataHora).toLocaleString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        {digitandoPor && (
          <div
            style={{
              fontStyle: "italic",
              color: "gray",
              textAlign: "bottom",
            }}
          >
            {digitandoPor} está digitando...
          </div>
        )}
      </main>

      {status !== 0 ? (
        <form onSubmit={handleSend} className="chat-input">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (connectionRef.current && e.target.value.trim() !== "") {
                console.log("Enviando evento Digitando");
                connectionRef.current.invoke("Digitando", id, "Cliente");
              }
            }}
            placeholder="Digite sua mensagem..."
            disabled={isSending}
          />

          <input
            type="file"
            accept="image/*"
            id="input-file"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0])}
          />

          <label
            htmlFor="input-file"
            className="icon-button"
            title="Anexar imagem"
          >
            <i className="bi bi-image"></i>
          </label>

          <button type="submit" disabled={isSending}>
            {isSending ? "Enviando..." : "Enviar"}
          </button>
        </form>
      ) : (
        <p style={{ textAlign: "center", marginTop: 10, color: "gray" }}>
          Este atendimento foi concluído. Você não pode mais enviar mensagens.
        </p>
      )}
    </div>
  );
}
