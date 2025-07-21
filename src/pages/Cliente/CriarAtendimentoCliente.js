import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function CriarAtendimento() {
  const [mensagem, setMensagem] = useState("");
  const [file, setFile] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const navigate = useNavigate();

  const enviarAtendimento = async () => {
    if (!mensagem.trim() && !file) {
      return alert("Digite uma mensagem ou selecione um anexo.");
    }

    setCarregando(true);

    try {
      const token = localStorage.getItem("token");
      let idExterno = "cliente_web";

      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        idExterno =
          payload[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
          ] || idExterno;
      }

      const response = await api.post("/atendimentocliente/criar", {
        idUsuarioExterno: idExterno,
        conteudo: mensagem.trim() || "Mensagem inicial vazia",
        dataHora: new Date().toISOString(),
      });

      const atendimentoCriado = response.data;

      if (file) {
        const formData = new FormData();
        formData.append("Conteudo", mensagem.trim() || "");
        formData.append("Imagem", file);

        await api.post(
          `/AtendimentoCliente/${atendimentoCriado.id}/anexo`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }

      navigate(`/cliente/atendimento/${atendimentoCriado.id}`);
    } catch (error) {
      console.error("Erro ao criar atendimento:", error);
      alert("Erro ao criar atendimento. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: darkMode ? "#141421" : "#eee",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className="chat-container-criar"
        style={{
          width: "100%",
          maxWidth: 600,
          backgroundColor: darkMode ? "#1f1f2e" : "#f9f9f9",
          color: darkMode ? "#f1f1f1" : "#000",
          padding: 24,
          borderRadius: 12,
          boxShadow: darkMode
            ? "0 2px 10px rgba(0,0,0,0.7)"
            : "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <div
          className="chat-header"
          style={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          <button
            onClick={() => navigate("/cliente/dashboard")}
            className="icon-button"
            style={{ color: darkMode ? "#ccc" : "#333" }}
          >
            <i className="bi bi-box-arrow-left"></i>
          </button>
          <h2 style={{ margin: 0 }}>Novo Atendimento</h2>
        </div>

        <textarea
          rows={6}
          placeholder="Descreva o que você precisa..."
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          disabled={carregando}
          style={{
            width: "100%",
            padding: "10px 15px",
            fontSize: "14px",
            borderRadius: 20,
            border: "1px solid #ccc",
            outline: "none",
            resize: "vertical",
            marginTop: 15,
            fontFamily: "Arial, sans-serif",
            backgroundColor: darkMode ? "#2a2a3f" : "#fff",
            color: darkMode ? "#fff" : "#000",
          }}
        />

        <input
          type="file"
          accept="image/*"
          id="input-file"
          style={{ display: "none" }}
          onChange={(e) => setFile(e.target.files[0])}
          disabled={carregando}
        />

        <label
          htmlFor="input-file"
          className="icon-button"
          title="Anexo"
          style={{
            marginTop: 15,
            cursor: carregando ? "default" : "pointer",
            color: carregando ? "#999" : "#6f42c1",
            fontSize: "1.5em",
            userSelect: "none",
            display: "inline-block",
          }}
        >
          <i className="bi bi-image"></i>
          {file && (
            <span
              style={{
                marginLeft: 8,
                fontSize: "0.9em",
                verticalAlign: "middle",
                color: darkMode ? "#ccc" : "#333",
              }}
            >
              {file.name.length > 25
                ? file.name.slice(0, 22) + "..."
                : file.name}
            </span>
          )}
        </label>

        <button
          onClick={enviarAtendimento}
          disabled={carregando || (!mensagem.trim() && !file)}
          style={{
            marginTop: 15,
            padding: "10px 20px",
            fontSize: "14px",
            borderRadius: 20,
            border: "none",
            backgroundColor: carregando ? "#8a63d2" : "#6f42c1",
            color: "white",
            fontWeight: "bold",
            cursor: carregando ? "default" : "pointer",
            transition: "background-color 0.3s",
          }}
        >
          {carregando ? "Criando..." : "Criar Atendimento"}
        </button>
      </div>
    </div>
  );
}
