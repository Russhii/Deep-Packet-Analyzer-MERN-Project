import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2, FileText, Calendar, HardDrive, BarChart } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CaptureDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [capture, setCapture] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCapture();
  }, [id]);

  const fetchCapture = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/captures/${id}`);
      setCapture(response.data);
    } catch (error) {
      console.error("Error fetching capture:", error);
      toast.error("Failed to fetch capture details");
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!capture) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Capture not found</p>
      </div>
    );
  }

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

      {/* Capture Details */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-4">Capture Details</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-purple-400 mt-1" />
              <div>
                <p className="text-gray-400 text-sm">Filename</p>
                <p className="text-white font-medium">{capture.filename}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-purple-400 mt-1" />
              <div>
                <p className="text-gray-400 text-sm">Upload Time</p>
                <p className="text-white font-medium">{formatDate(capture.upload_time)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <HardDrive className="w-5 h-5 text-purple-400 mt-1" />
              <div>
                <p className="text-gray-400 text-sm">File Size</p>
                <p className="text-white font-medium">{formatBytes(capture.file_size)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <BarChart className="w-5 h-5 text-purple-400 mt-1" />
              <div>
                <p className="text-gray-400 text-sm">Analysis Status</p>
                {capture.analyzed ? (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm inline-block mt-1">
                    Analyzed
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm inline-block mt-1">
                    Pending Analysis
                  </span>
                )}
              </div>
            </div>

            {capture.analysis_time && (
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-purple-400 mt-1" />
                <div>
                  <p className="text-gray-400 text-sm">Analysis Time</p>
                  <p className="text-white font-medium">{formatDate(capture.analysis_time)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {capture.analyzed && (
          <div className="mt-6">
            <button
              onClick={() => navigate(`/analysis/${capture.id}`)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              View Analysis Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptureDetails;
