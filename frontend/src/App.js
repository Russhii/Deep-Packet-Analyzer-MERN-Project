import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import "@/App.css";
import Dashboard from "@/pages/Dashboard";
import CaptureDetails from "@/pages/CaptureDetails";
import AnalysisReport from "@/pages/AnalysisReport";
import BlockingRules from "@/pages/BlockingRules";
import { Toaster } from "sonner";
import { FileSearch, Shield, Upload, BarChart } from "lucide-react";

const Layout = ({ children }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <FileSearch className="w-8 h-8 text-purple-400" />
                <span className="text-2xl font-bold text-white">DPI Engine</span>
              </div>
              
              <div className="hidden md:flex space-x-4">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/")
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Dashboard</span>
                  </div>
                </Link>
                <Link
                  to="/rules"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/rules")
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Blocking Rules</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/capture/:id" element={<CaptureDetails />} />
            <Route path="/analysis/:id" element={<AnalysisReport />} />
            <Route path="/rules" element={<BlockingRules />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
