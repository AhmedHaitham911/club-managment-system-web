import { useEffect, useState, useContext } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Send, ShieldAlert } from "lucide-react";
import { AuthContext } from "../../context/auth-context";
import { api, getErrorMessage, unwrapData } from "../../lib/api";

export default function AdminChat() {
  const { user } = useContext(AuthContext);
  const isOfficer = user?.role === "Officer";
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const loadMessages = async () => {
    const res = await api.get("/admin/chat/messages?limit=100");
    setMessages(unwrapData(res) || []);
  };

  useEffect(() => {
    if (!isOfficer) return;

    loadMessages().catch((error) => {
      toast.error(getErrorMessage(error, "Failed to load chat."));
    });
  }, [isOfficer]);

  if (!isOfficer) {
    return <Navigate to="/" replace />;
  }

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const toastId = toast.loading("Sending...");
    try {
      await api.post("/admin/chat/messages", { message: text.trim() });
      setText("");
      await loadMessages();
      toast.success("Sent.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "Send failed."), { id: toastId });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-4">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
        <ShieldAlert className="text-orange-500" /> Admin Chat
      </h1>

      <div className="p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 h-[55vh] overflow-y-auto space-y-3">
        {messages.map((m) => (
          <div key={m._id} className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800">
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400">{m.senderDisplayName}</div>
            <div className="text-sm text-gray-800 dark:text-gray-200">{m.message}</div>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white"
          placeholder="Type a message"
        />
        <button type="submit" className="px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center gap-2">
          <Send size={16} /> Send
        </button>
      </form>
    </div>
  );
}
