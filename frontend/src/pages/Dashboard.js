import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Upload, FileText, Calendar, HardDrive, Play, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [captures, setCaptures] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCaptures();
  }, []);

  const fetchCaptures = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/captures`);
      setCaptures(response.data);
    } catch (error) {
      console.error("Error fetching captures:", error);
      toast.error("Failed to fetch captures");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".pcap") && !file.name.endsWith(".pcapng")) {
      toast.error("Please upload a valid PCAP file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("pcap", file);

    try {
      const response = await axios.post(`${API}/captures/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("PCAP file uploaded successfully!");
      fetchCaptures();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(error.response?.data?.detail || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async (captureId) => {
    setAnalyzing({ ...analyzing, [captureId]: true });
    try {
      await axios.post(`${API}/captures/${captureId}/analyze`);
      toast.success("Analysis complete!");
      fetchCaptures();
      // Navigate to analysis report
      navigate(`/analysis/${captureId}`);
    } catch (error) {
      console.error("Error analyzing capture:", error);
      toast.error(error.response?.data?.detail || "Failed to analyze capture");
    } finally {
      setAnalyzing({ ...analyzing, [captureId]: false });
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-2">Packet Analyzer Dashboard</h1>
        <p className="text-gray-300">Upload and analyze PCAP files with Deep Packet Inspection</p>
      </div>

      {/* Upload Section */}
      <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-lg rounded-lg p-8 border border-purple-500/30">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Upload className="w-16 h-16 text-purple-400" />
          <h2 className="text-2xl font-semibold text-white">Upload PCAP File</h2>
          <p className="text-gray-300 text-center max-w-md">
            Upload a network capture file (.pcap or .pcapng) to analyze network traffic and detect applications
          </p>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pcap,.pcapng"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <div className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2">
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Choose File</span>
                </>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Captures List */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
        <h2 className="text-2xl font-semibold text-white mb-4">Uploaded Captures</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : captures.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No captures uploaded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="pb-3 text-gray-300 font-medium">Filename</th>
                  <th className="pb-3 text-gray-300 font-medium">Upload Time</th>
                  <th className="pb-3 text-gray-300 font-medium">Size</th>
                  <th className="pb-3 text-gray-300 font-medium">Status</th>
                  <th className="pb-3 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {captures.map((capture) => (
                  <tr key={capture.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 text-white">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span>{capture.filename}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-300">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(capture.upload_time)}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-300">
                      <div className="flex items-center space-x-2">
                        <HardDrive className="w-4 h-4" />
                        <span>{formatBytes(capture.file_size)}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      {capture.analyzed ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                          Analyzed
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        {!capture.analyzed ? (
                          <button
                            onClick={() => handleAnalyze(capture.id)}
                            disabled={analyzing[capture.id]}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {analyzing[capture.id] ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Analyzing...</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                <span>Analyze</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/analysis/${capture.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            View Report
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
