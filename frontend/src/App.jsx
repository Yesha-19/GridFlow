import React from 'react';
import { Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar.jsx';
import Home from './pages/Home.jsx';
import DashboardPage from './pages/Dashboard.jsx';
import Validation from './pages/Validation.jsx';
import Analytics from './pages/Analytics.jsx';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-console-bg text-console-text font-sans">
      <NavBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/validation" element={<Validation />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </main>
    </div>
  );
}
