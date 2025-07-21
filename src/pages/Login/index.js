import React, { useState } from "react";
import "./styles.css";
import logoGruppy from "../../assets/logo.png";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();

    try {
      const response = await api.post("/Auth/login", {
        userName,
        password,
      });

      const { token, nome, role } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("nome", nome);
      localStorage.setItem("role", role);

      if (role === "Cliente") {
        navigate("/cliente/dashboard");
      } else if (role === "Atendente") {
        navigate("/atendente/dashboard");
      }
    } catch (error) {
      alert("Usuário ou senha inválidos");
      console.error("Erro ao fazer login:", error);
    }
  }

  return (
    <div className="login-container">
      <section className="form">
        <img src={logoGruppy} alt="Gruppy" />
        <form onSubmit={handleLogin}>
          <h1>Faça login ou crie uma conta</h1>
          <input
            placeholder="Usuário"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="button" type="submit">
            Login
          </button>
        </form>
      </section>
    </div>
  );
}
