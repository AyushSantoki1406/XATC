import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "https://xat-fg8p.onrender.com";

// Generate or retrieve session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem("x-session-id");
  if (!sessionId) {
    sessionId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    localStorage.setItem("x-session-id", sessionId);
  }
  return sessionId;
};

// Axios instance with session ID
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "X-Session-ID": getSessionId(),
  },
});

// Flash Messages Component
const FlashMessages = ({ messages, setMessages }) => {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="space-y-2">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg flex justify-between items-center text-white ${
            msg.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}
        >
          <span>{msg.message}</span>
          <button
            className="text-white hover:text-gray-200"
            onClick={() => setMessages(messages.filter((_, i) => i !== index))}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      ))}
    </div>
  );
};

// Setup Component
const Setup = () => {
  const [botToken, setBotToken] = useState("");
  const [alertType, setAlertType] = useState("personal");
  const [flashMessages, setFlashMessages] = useState([]);
  const navigate = useNavigate();

  const handleSetup = async () => {
    try {
      const response = await axiosInstance.post("/setup", {
        bot_token: botToken,
        alert_type: alertType,
      });
      if (response.headers["x-session-id"]) {
        localStorage.setItem("x-session-id", response.headers["x-session-id"]);
        axiosInstance.defaults.headers["X-Session-ID"] =
          response.headers["x-session-id"];
      }
      const { userId, flashMessages } = response.data;
      setFlashMessages(
        flashMessages || [
          { message: "Bot configured successfully!", type: "success" },
        ]
      );
      if (userId) navigate(`/dashboard/${userId}`);
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        "An error occurred while setting up the bot";
      const flashMessages = error.response?.data?.flashMessages || [];
      setFlashMessages([
        ...flashMessages,
        { message: errorMsg, type: "error" },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto">
          <span className="text-xl font-bold">
            <i className="fas fa-robot mr-2"></i>TradingView Bot
          </span>
        </div>
      </nav>
      <div className="container mx-auto mt-4 px-4">
        <FlashMessages
          messages={flashMessages}
          setMessages={setFlashMessages}
        />
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <div className="bg-gray-800 rounded-lg">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold">
                  <i className="fas fa-cog mr-2"></i>Connect Telegram Bot
                </h3>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Bot Token
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Get your bot token from @BotFather on Telegram
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Alert Type
                  </label>
                  <select
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value)}
                    required
                  >
                    <option value="personal">Personal Messages</option>
                    <option value="group">Group Chat</option>
                    <option value="channel">Channel</option>
                  </select>
                </div>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
                  onClick={handleSetup}
                >
                  <i className="fas fa-check mr-2"></i>Setup Bot
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [flashMessages, setFlashMessages] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axiosInstance.get(`/dashboard/${userId}`);
        if (response.headers["x-session-id"]) {
          localStorage.setItem(
            "x-session-id",
            response.headers["x-session-id"]
          );
          axiosInstance.defaults.headers["X-Session-ID"] =
            response.headers["x-session-id"];
        }
        const {
          botUsername,
          authStatus,
          webhookUrl,
          recentAlerts,
          flashMessages,
        } = response.data;
        setUserData({ botUsername, authStatus, webhookUrl, userId });
        setRecentAlerts(recentAlerts || []);
        setFlashMessages(flashMessages || []);
      } catch (err) {
        setError(
          err.response?.status === 404 ? "User not found" : "An error occurred"
        );
      }
    };
    fetchDashboardData();
  }, [userId]);

  const handleRegenerateSecret = async () => {
    try {
      const response = await axiosInstance.get(`/regenerate/${userId}`);
      if (response.headers["x-session-id"]) {
        localStorage.setItem("x-session-id", response.headers["x-session-id"]);
        axiosInstance.defaults.headers["X-Session-ID"] =
          response.headers["x-session-id"];
      }
      const { flashMessages } = response.data;
      setFlashMessages(
        flashMessages || [
          { message: "Secret key regenerated successfully!", type: "success" },
        ]
      );
      // Refresh dashboard data
      navigate(0);
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || "Failed to regenerate secret key";
      const flashMessages = error.response?.data?.flashMessages || [];
      setFlashMessages([
        ...flashMessages,
        { message: errorMsg, type: "error" },
      ]);
    }
  };

  const copyWebhook = () => {
    if (userData?.webhookUrl) {
      navigator.clipboard.writeText(userData.webhookUrl).then(() => {
        const icon = document.querySelector(".copy-btn");
        icon.className = "fas fa-check copy-btn ml-2";
        setTimeout(() => {
          icon.className = "fas fa-copy copy-btn ml-2";
        }, 2000);
      });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{error}</h1>
          <a
            href="/"
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <span className="text-xl font-bold">
            <i className="fas fa-robot mr-2"></i>TradingView Bot
          </span>
          <a
            href="/"
            className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 text-sm"
          >
            New Bot
          </a>
        </div>
      </nav>
      <div className="container mx-auto mt-4 px-4">
        <FlashMessages
          messages={flashMessages}
          setMessages={setFlashMessages}
        />
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="bg-gray-800 rounded-lg">
              <div className="p-4 border-b border-gray-700">
                <h4 className="text-lg font-semibold">
                  <i className="fas fa-robot mr-2"></i>Bot: @
                  {userData.botUsername}
                </h4>
              </div>
              <div className="p-4">
                {userData.authStatus && (
                  <div
                    className={`p-4 rounded-lg ${
                      userData.authStatus.type === "warning"
                        ? "bg-yellow-600"
                        : userData.authStatus.type === "success"
                        ? "bg-green-600"
                        : "bg-blue-600"
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: userData.authStatus.message,
                    }}
                  />
                )}
                <div className="mt-4">
                  <h6 className="text-sm font-medium">
                    Webhook URL for TradingView:
                  </h6>
                  <div className="bg-gray-700 border border-gray-600 p-3 rounded flex justify-between items-center">
                    <code id="webhook-url">{userData.webhookUrl}</code>
                    <i
                      className="fas fa-copy copy-btn ml-2 cursor-pointer"
                      onClick={copyWebhook}
                      title="Copy to clipboard"
                    ></i>
                  </div>
                  <small className="text-gray-400">
                    Copy this URL and use it in your TradingView alert webhook
                    settings.
                  </small>
                </div>
                <div className="mt-4">
                  <button
                    className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 flex items-center text-sm"
                    onClick={handleRegenerateSecret}
                  >
                    <i className="fas fa-sync mr-2"></i>Regenerate Secret
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <div className="bg-gray-800 rounded-lg">
              <div className="p-4 border-b border-gray-700">
                <h6 className="text-sm font-medium">
                  <i className="fas fa-chart-line mr-2"></i>Recent Alerts
                </h6>
              </div>
              <div className="p-4">
                {recentAlerts.length > 0 ? (
                  recentAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-2 mb-2 rounded ${
                        alert.sentSuccessfully ? "bg-green-600" : "bg-red-600"
                      }`}
                    >
                      <small>
                        <i
                          className={`fas fa-${
                            alert.sentSuccessfully ? "check" : "times"
                          } mr-1`}
                        ></i>
                        {new Date(alert.createdAt).toLocaleString()} -{" "}
                        {alert.webhookData}
                      </small>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 mb-0">No alerts yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Setup />} />
        <Route path="/dashboard/:userId" element={<Dashboard />} />
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold">Page Not Found</h1>
                <a
                  href="/"
                  className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Go Home
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

// Render the app
const root = createRoot(document.getElementById("root"));
root.render(<App />);
export default App