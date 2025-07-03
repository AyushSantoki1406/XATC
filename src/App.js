import { React, useState, useEffect, useCallback } from "react";
import axios from "axios";

const App = () => {
  const [botToken, setBotToken] = useState("");
  const [alertType, setAlertType] = useState("personal");
  const [flashMessages, setFlashMessages] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const BASE_URL = "https://xat-fg8p.onrender.com"; // Explicitly set backend URL

  const addFlashMessage = (message, type = "success") => {
    setFlashMessages([...flashMessages, { message, type }]);
    setTimeout(() => setFlashMessages((msgs) => msgs.slice(1)), 5000);
  };

  const handleSetupBot = async (e) => {
    e.preventDefault();
    console.log("Sending POST to:", `${BASE_URL}/api/setup_bot`, {
      bot_token: botToken,
      alert_type: alertType,
    });
    try {
      const response = await axios.post(`${BASE_URL}/api/setup_bot`, {
        bot_token: botToken,
        alert_type: alertType,
      });
      addFlashMessage(
        `Bot @${response.data.bot_username} verified successfully! Use your unique authentication command in the bot.`
      );
      fetchDashboard(response.data.user_id);
    } catch (error) {
      console.error("Setup bot error:", error);
      addFlashMessage(
        error.response?.data?.error || "Error setting up bot",
        "error"
      );
    }
  };

  const fetchDashboard = useCallback(
    async (id) => {
      console.log(
        "Fetching dashboard from:",
        `${BASE_URL}/api/dashboard/${id}`
      );
      try {
        const response = await axios.get(`${BASE_URL}/api/dashboard/${id}`);
        setDashboardData(response.data);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        addFlashMessage("Error loading dashboard", "error");
      }
    },
    []
  ); // Added addFlashMessage to dependencies

  const copyToClipboard = (text, buttonRef) => {
    navigator.clipboard.writeText(text).then(() => {
      const button = buttonRef.current;
      const originalHtml = button.innerHTML;
      button.innerHTML = '<i class="fas fa-check"></i>';
      button.classList.remove("bg-gray-600", "hover:bg-gray-700");
      button.classList.add("bg-green-500", "hover:bg-green-600");
      setTimeout(() => {
        button.innerHTML = originalHtml;
        button.classList.remove("bg-green-500", "hover:bg-green-600");
        button.classList.add("bg-gray-600", "hover:bg-gray-700");
      }, 2000);
    });
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("user_id");
    if (userId) {
      fetchDashboard(userId);
    }
  }, [fetchDashboard]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto">
          <a href="/" className="text-xl font-bold flex items-center">
            <i className="fas fa-robot mr-2"></i>TradingView Bot
          </a>
        </div>
      </nav>

      <main className="container mx-auto p-4">
        {flashMessages.map((msg, index) => (
          <div
            key={index}
            className={`alert p-4 mb-4 rounded-lg ${
              msg.type === "error" ? "bg-red-500" : "bg-green-500"
            }`}
          >
            {msg.message}
            <button
              className="ml-2"
              onClick={() =>
                setFlashMessages((msgs) => msgs.filter((_, i) => i !== index))
              }
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        ))}

        {!dashboardData ? (
          <div className="max-w-lg mx-auto mt-8">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <i className="fas fa-plug mr-2"></i>Connect Your Telegram Bot
              </h2>
              <p className="text-gray-400 mb-4">
                Connect your Telegram bot to receive TradingView alerts
                automatically.
              </p>
              <form onSubmit={handleSetupBot}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    <i className="fas fa-key mr-2"></i>Bot Token
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 bg-gray-700 rounded-lg"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                    required
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Get your bot token from{" "}
                    <a
                      href="https://t.me/BotFather"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400"
                    >
                      @BotFather
                    </a>{" "}
                    on Telegram.
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    <i className="fas fa-bell mr-2"></i>Where to receive alerts?
                  </label>
                  <select
                    className="w-full p-2 bg-gray-700 rounded-lg"
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value)}
                    required
                  >
                    <option value="personal">
                      Personal Message (Direct to Bot)
                    </option>
                    <option value="group">Telegram Group</option>
                    <option value="channel">Telegram Channel</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded-lg"
                >
                  <i className="fas fa-check mr-2"></i>Verify Bot & Continue
                </button>
              </form>
            </div>
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 mt-4">
              <h5 className="text-lg font-bold mb-2">
                <i className="fas fa-info-circle mr-2"></i>How it works
              </h5>
              <ol className="list-decimal pl-5">
                <li className="mb-2">
                  Create a bot with{" "}
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400"
                  >
                    @BotFather
                  </a>
                </li>
                <li className="mb-2">
                  Enter your bot token above and choose where to receive alerts
                </li>
                <li className="mb-2">
                  Use the unique authentication command provided in your bot
                  chat
                </li>
                <li className="mb-2">
                  Copy the generated webhook URL to your TradingView Alerts
                </li>
                <li>Receive formatted alerts automatically!</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="md:col-span-2">
              <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">
                    <i className="fas fa-robot mr-2"></i>Bot: @
                    {dashboardData.user.bot_username}
                  </h2>
                  <span className="bg-green-500 px-2 py-1 rounded">
                    Connected
                  </span>
                </div>
                <div className="mb-4">
                  <strong>Alert Type:</strong>
                  <span className="bg-blue-500 px-2 py-1 rounded ml-2">
                    {dashboardData.user.alert_type}
                  </span>
                </div>
                <div className="mb-4">
                  <strong>Status:</strong>
                  {dashboardData.user.chat_id ? (
                    <span className="bg-green-500 px-2 py-1 rounded ml-2">
                      <i className="fas fa-check mr-1"></i>Ready to receive
                      alerts
                    </span>
                  ) : (
                    <span className="bg-yellow-500 px-2 py-1 rounded ml-2">
                      <i className="fas fa-exclamation-triangle mr-1"></i>
                      Waiting for authentication
                    </span>
                  )}
                </div>
                <div className="mb-4">
                  <strong>Auth Command:</strong>
                  <code className="bg-gray-700 p-1 rounded ml-2">
                    {dashboardData.user.auth_command}
                  </code>
                </div>
                <hr className="my-4" />
                <h5 className="text-lg font-bold mb-2">
                  <i className="fas fa-link mr-2"></i>TradingView Webhook URL
                </h5>
                <p className="text-gray-400 mb-2">
                  Copy this URL to your TradingView alert settings:
                </p>
                <div className="flex">
                  <input
                    type="text"
                    className="flex-grow p-2 bg-gray-700 rounded-l-lg font-mono"
                    value={dashboardData.webhook_url}
                    readOnly
                  />
                  <button
                    className="bg-gray-600 hover:bg-gray-700 p-2 rounded-r-lg"
                    onClick={(e) =>
                      copyToClipboard(dashboardData.webhook_url, {
                        current: e.target,
                      })
                    }
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    className="bg-yellow-600 hover:bg-yellow-700 p-2 rounded"
                    onClick={async () => {
                      if (
                        window.confirm(
                          "This will change your webhook URL. Update TradingView accordingly."
                        )
                      ) {
                        console.log(
                          "Regenerating secret for:",
                          `${BASE_URL}/api/user/${dashboardData.user.id}/regenerate_secret`
                        );
                        await axios.post(
                          `${BASE_URL}/api/user/${dashboardData.user.id}/regenerate_secret`
                        );
                        fetchDashboard(dashboardData.user.id);
                        addFlashMessage("Secret key regenerated successfully!");
                      }
                    }}
                  >
                    <i className="fas fa-sync mr-1"></i>Regenerate Secret
                  </button>
                  <a
                    href="/"
                    className="bg-gray-600 hover:bg-gray-700 p-2 rounded"
                  >
                    <i className="fas fa-edit mr-1"></i>Edit Bot Settings
                  </a>
                </div>
              </div>
            </div>
            <div>
              <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <h5 className="text-lg font-bold mb-2">
                  <i className="fas fa-key mr-2"></i>Authentication Required
                </h5>
                {dashboardData.user.chat_id ? (
                  <div className="bg-green-500 p-4 rounded">
                    <h6 className="font-bold">
                      <i className="fas fa-check-circle mr-2"></i>Authenticated!
                    </h6>
                    <p>
                      Your {dashboardData.user.alert_type} is ready to receive
                      alerts.
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-500 p-4 rounded">
                    <h6 className="font-bold">
                      <i className="fas fa-exclamation-triangle mr-2"></i>Action
                      Required
                    </h6>
                    <p className="mb-2">To activate your bot:</p>
                    <ol className="list-decimal pl-5 mb-3">
                      {dashboardData.user.alert_type === "personal" ? (
                        <>
                          <li>
                            Start a chat with{" "}
                            <strong>@{dashboardData.user.bot_username}</strong>
                          </li>
                          <li>Send this exact command:</li>
                        </>
                      ) : dashboardData.user.alert_type === "group" ? (
                        <>
                          <li>
                            Add{" "}
                            <strong>@{dashboardData.user.bot_username}</strong>{" "}
                            to your group
                          </li>
                          <li>In the group, send this exact command:</li>
                        </>
                      ) : (
                        <>
                          <li>
                            Add{" "}
                            <strong>@{dashboardData.user.bot_username}</strong>{" "}
                            to your channel
                          </li>
                          <li>
                            Make the bot an admin with "Post Messages"
                            permission
                          </li>
                          <li>In the channel, send this exact command:</li>
                        </>
                      )}
                    </ol>
                    <div className="bg-gray-700 p-4 rounded flex items-center">
                      <code
                        id="auth-command-text"
                        className="text-green-400 flex-grow"
                      >
                        {dashboardData.user.auth_command}
                      </code>
                      <button
                        className="bg-gray-600 hover:bg-gray-700 p-2 rounded"
                        onClick={(e) =>
                          copyToClipboard(dashboardData.user.auth_command, {
                            current: e.target,
                          })
                        }
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      <i className="fas fa-info-circle mr-1"></i>
                      This unique command is specific to your bot for security.
                    </p>
                  </div>
                )}
                <hr className="my-4" />
                <h6 className="font-bold">
                  <i className="fas fa-chart-line mr-2"></i>TradingView Setup
                </h6>
                <ol className="list-decimal pl-5 text-sm">
                  <li>Open your TradingView alert</li>
                  <li>Go to "Notifications" tab</li>
                  <li>Check "Webhook URL"</li>
                  <li>Paste your webhook URL</li>
                  <li>Set method to POST</li>
                  <li>Save your alert</li>
                </ol>
              </div>
              {dashboardData.alerts?.length > 0 && (
                <div className="bg-gray-800 rounded-lg shadow-lg p-6 mt-4">
                  <h6 className="font-bold mb-2">
                    <i className="fas fa-history mr-2"></i>Recent Alerts
                  </h6>
                  {dashboardData.alerts.slice(-5).map((alert, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center mb-2"
                    >
                      <small className="text-gray-400">
                        {alert.created_at}
                      </small>
                      <span
                        className={`px-2 py-1 rounded ${
                          alert.sent_successfully
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >
                        {alert.sent_successfully ? "Sent" : "Failed"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
