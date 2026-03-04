import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Shield,
  Plus,
  Trash2,
  Loader2,
  Edit,
  CheckCircle,
  XCircle,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BlockingRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_type: "domain",
    value: "",
    description: "",
    enabled: true,
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/rules`);
      setRules(response.data);
    } catch (error) {
      console.error("Error fetching rules:", error);
      toast.error("Failed to fetch rules");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/rules`, newRule);
      toast.success("Rule added successfully!");
      setShowAddModal(false);
      setNewRule({
        rule_type: "domain",
        value: "",
        description: "",
        enabled: true,
      });
      fetchRules();
    } catch (error) {
      console.error("Error adding rule:", error);
      toast.error(error.response?.data?.detail || "Failed to add rule");
    }
  };

  const handleToggleRule = async (ruleId, currentStatus) => {
    try {
      await axios.patch(`${API}/rules/${ruleId}`, {
        enabled: !currentStatus,
      });
      toast.success("Rule updated successfully!");
      fetchRules();
    } catch (error) {
      console.error("Error updating rule:", error);
      toast.error("Failed to update rule");
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) return;

    try {
      await axios.delete(`${API}/rules/${ruleId}`);
      toast.success("Rule deleted successfully!");
      fetchRules();
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast.error("Failed to delete rule");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getRuleTypeColor = (type) => {
    switch (type) {
      case "ip":
        return "bg-blue-500/20 text-blue-400";
      case "app":
        return "bg-purple-500/20 text-purple-400";
      case "domain":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
              <Shield className="w-8 h-8" />
              <span>Blocking Rules</span>
            </h1>
            <p className="text-gray-300">
              Manage rules to block traffic by IP, application, or domain
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {/* Rules Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-lg rounded-lg p-6 border border-blue-500/30">
          <h3 className="text-blue-400 font-semibold mb-2">IP Blocking</h3>
          <p className="text-gray-300 text-sm">
            Block all traffic from specific source IP addresses
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-lg p-6 border border-purple-500/30">
          <h3 className="text-purple-400 font-semibold mb-2">App Blocking</h3>
          <p className="text-gray-300 text-sm">
            Block traffic from specific applications (YouTube, Facebook, etc.)
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-lg rounded-lg p-6 border border-green-500/30">
          <h3 className="text-green-400 font-semibold mb-2">Domain Blocking</h3>
          <p className="text-gray-300 text-sm">
            Block traffic containing specific domain patterns
          </p>
        </div>
      </div>

      {/* Rules List */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Active Rules ({rules.length})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No blocking rules configured</p>
            <p className="text-sm mt-2">Add a rule to start blocking traffic</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="pb-3 text-gray-300 font-medium">Type</th>
                  <th className="pb-3 text-gray-300 font-medium">Value</th>
                  <th className="pb-3 text-gray-300 font-medium">Description</th>
                  <th className="pb-3 text-gray-300 font-medium">Created</th>
                  <th className="pb-3 text-gray-300 font-medium">Status</th>
                  <th className="pb-3 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getRuleTypeColor(
                          rule.rule_type
                        )}`}
                      >
                        {rule.rule_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 text-white font-mono">{rule.value}</td>
                    <td className="py-4 text-gray-300">
                      {rule.description || "-"}
                    </td>
                    <td className="py-4 text-gray-300">
                      {formatDate(rule.created_at)}
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => handleToggleRule(rule.id, rule.enabled)}
                        className="flex items-center space-x-1"
                      >
                        {rule.enabled ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 text-sm">
                              Enabled
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-400 text-sm">
                              Disabled
                            </span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Add Blocking Rule</h2>
            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Rule Type
                </label>
                <select
                  value={newRule.rule_type}
                  onChange={(e) =>
                    setNewRule({ ...newRule, rule_type: e.target.value })
                  }
                  className="w-full bg-white/5 text-white border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="domain">Domain</option>
                  <option value="app">Application</option>
                  <option value="ip">IP Address</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Value
                </label>
                <input
                  type="text"
                  value={newRule.value}
                  onChange={(e) =>
                    setNewRule({ ...newRule, value: e.target.value })
                  }
                  placeholder={
                    newRule.rule_type === "ip"
                      ? "192.168.1.100"
                      : newRule.rule_type === "app"
                      ? "YouTube"
                      : "facebook.com"
                  }
                  className="w-full bg-white/5 text-white border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newRule.description}
                  onChange={(e) =>
                    setNewRule({ ...newRule, description: e.target.value })
                  }
                  placeholder="Block social media during work hours"
                  className="w-full bg-white/5 text-white border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={newRule.enabled}
                  onChange={(e) =>
                    setNewRule({ ...newRule, enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="enabled" className="text-gray-300 text-sm">
                  Enable rule immediately
                </label>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Add Rule
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockingRules;
