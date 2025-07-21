import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from './pages/Login';
import ChatCliente from "./pages/Cliente/ChatCliente";
import ChatAtendente from "./pages/Atendente/ChatAtendente";
import DashboardCliente from "./pages/Cliente/Dashboard";
import DashboardAtendente from "./pages/Atendente/Dashboard";
import Admin from "./pages/Admin";
import CriarAtendimentoCliente from "./pages/Cliente/CriarAtendimentoCliente";
import CriarAtendimentoAtendente from "./pages/Atendente/CriarAtendimentoAtendente";


export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cliente/atendimento/:id" element={<ChatCliente />} />
        <Route path="/cliente/dashboard" element={<DashboardCliente/>}/>
        <Route path="/atendente/atendimento/:id" element={<ChatAtendente/>}/>
        <Route path="/atendente/dashboard" element={<DashboardAtendente/>}/>
        <Route path="/cliente/criar-atendimento" element={<CriarAtendimentoCliente />} />
        <Route path="/atendente/criar-atendimento" element={<CriarAtendimentoAtendente />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
