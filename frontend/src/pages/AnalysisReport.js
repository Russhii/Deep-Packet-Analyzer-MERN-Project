import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Package,
  HardDrive,
  CheckCircle,
  XCircle,
  BarChart3,
  Globe,
  Filter,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnalysisReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flowFilter, setFlowFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportRes, flowsRes] = await Promise.all([
        axios.get(`${API}/analysis/report/${id}`),
        axios.get(`${API}/analysis/flows/${id}`),
      ]);
      setReport(reportRes.data);
      setFlows(flowsRes.data);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      toast.error("Failed to fetch analysis report");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const COLORS = [
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#ef4444",
    "#14b8a6",
    "#f97316",
  ];

  const filteredFlows = flows.filter((flow) => {
    if (flowFilter === "all") return true;
    if (flowFilter === "blocked") return flow.blocked;
    if (flowFilter === "forwarded") return !flow.blocked;
    return flow.app_type === flowFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Analysis report not found</p>
      </div>
    );
  }

  const pieData = Object.entries(report.app_breakdown).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-2">Analysis Report</h1>
        <p className="text-gray-300">Deep Packet Inspection Results</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-lg rounded-lg p-6 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Total Packets</p>
              <p className="text-3xl font-bold text-white mt-2">
                {report.total_packets.toLocaleString()}
              </p>
            </div>
            <Package className="w-12 h-12 text-purple-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-lg rounded-lg p-6 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Total Bytes</p>
              <p className="text-3xl font-bold text-white mt-2">
                {formatBytes(report.total_bytes)}
              </p>
            </div>
            <HardDrive className="w-12 h-12 text-blue-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-lg rounded-lg p-6 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Forwarded</p>
              <p className="text-3xl font-bold text-white mt-2">
                {report.forwarded.toLocaleString()}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-600/20 to-pink-600/20 backdrop-blur-lg rounded-lg p-6 border border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Dropped</p>
              <p className="text-3xl font-bold text-white mt-2">
                {report.dropped.toLocaleString()}
              </p>
            </div>
            <XCircle className="w-12 h-12 text-red-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Application Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Application Breakdown (SNI-Based)</span>
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* ML Traffic Classification */}
        <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 backdrop-blur-lg rounded-lg p-6 border border-cyan-500/30">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>🤖 ML Traffic Classification</span>
          </h2>
          {report.ml_category_breakdown ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(report.ml_category_breakdown).map(([name, value]) => ({
                    name,
                    value,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.keys(report.ml_category_breakdown).map((key, index) => (
                    <Cell key={`cell-ml-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-4">ML classification not available</p>
          )}
          <div className="mt-4 text-sm text-cyan-300">
            ✨ Machine Learning classifies traffic by behavior patterns
          </div>
        </div>
      </div>

      {/* Detected Domains & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Detected Domains ({report.detected_domains.length})</span>
          </h2>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {report.detected_domains.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No domains detected</p>
            ) : (
              report.detected_domains.map((domain, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded px-3 py-2 text-gray-300 hover:bg-white/10 transition-colors"
                >
                  {domain}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ML Feature Importance */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>🧠 ML Feature Importance</span>
          </h2>
          {report.ml_feature_importance ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {Object.entries(report.ml_feature_importance)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([feature, importance], index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300 capitalize">
                        {feature.replace(/_/g, " ")}
                      </span>
                      <span className="text-cyan-400">{(importance * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${importance * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">Feature importance not available</p>
          )}
          <div className="mt-4 text-sm text-gray-400">
            Shows which features the ML model considers most important for classification
          </div>
        </div>
      </div>

      {/* Flows Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Flows ({filteredFlows.length})</span>
          </h2>
          <select
            value={flowFilter}
            onChange={(e) => setFlowFilter(e.target.value)}
            className="bg-white/5 text-white border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Flows</option>
            <option value="blocked">Blocked Only</option>
            <option value="forwarded">Forwarded Only</option>
            {Object.keys(report.app_breakdown).map((app) => (
              <option key={app} value={app}>
                {app} Only
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-3 text-gray-300 font-medium">Source</th>
                <th className="pb-3 text-gray-300 font-medium">Destination</th>
                <th className="pb-3 text-gray-300 font-medium">Protocol</th>
                <th className="pb-3 text-gray-300 font-medium">App</th>
                <th className="pb-3 text-gray-300 font-medium">ML Category</th>
                <th className="pb-3 text-gray-300 font-medium">SNI/Host</th>
                <th className="pb-3 text-gray-300 font-medium">Packets</th>
                <th className="pb-3 text-gray-300 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredFlows.slice(0, 100).map((flow) => (
                <tr key={flow.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 text-gray-300">
                    {flow.src_ip}:{flow.src_port}
                  </td>
                  <td className="py-3 text-gray-300">
                    {flow.dst_ip}:{flow.dst_port}
                  </td>
                  <td className="py-3 text-gray-300">{flow.protocol}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm">
                      {flow.app_type}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col">
                      <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-sm inline-block">
                        🤖 {flow.ml_category || "Unknown"}
                      </span>
                      {flow.ml_confidence && (
                        <span className="text-xs text-gray-400 mt-1">
                          {(flow.ml_confidence * 100).toFixed(0)}% confidence
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-gray-300 max-w-xs truncate">
                    {flow.sni || "-"}
                  </td>
                  <td className="py-3 text-gray-300">{flow.packet_count}</td>
                  <td className="py-3">
                    {flow.blocked ? (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-sm">
                        Blocked
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                        Forwarded
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredFlows.length > 100 && (
            <p className="text-gray-400 text-center mt-4">
              Showing first 100 of {filteredFlows.length} flows
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisReport;
