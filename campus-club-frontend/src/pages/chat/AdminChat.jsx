import { useState, useEffect, useContext, useRef } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { Send, ShieldAlert, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminChat() {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // 🚀 حماية: لو اللي داخل مش أدمن، يطرده بره
  if (user?.role !== "Officer") {
    return <Navigate to="/" replace />;
  }

  // 🚀 دالة جلب الرسايل
  const fetchMessages = async () => {
    try {
      const response = await axios.get("http://localhost:5000/admin_messages");
      // بنعمل check لو الداتا متغيرة عشان منعملش ريندر عالفاضي كل ثانيتين
      if (JSON.stringify(response.data) !== JSON.stringify(messages)) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error("Failed to load messages");
    }
  };

  // 🚀 Polling: بيجيب الرسايل كل ثانيتين عشان يحاكي الـ Real-time
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval); // تنظيف لما الصفحة تتقفل
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // 🚀 سكرول تلقائي لتحت لما تيجي رسالة جديدة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        userId: String(user.id),
        userName: user.name,
        text: newMessage,
        timestamp: new Date().toISOString(),
      };

      // بنضيف الرسالة محلياً الأول عشان الـ UI يبان سريع
      setMessages((prev) => [...prev, { ...messageData, id: Date.now() }]);
      setNewMessage("");

      // بنبعتها للسيرفر
      await axios.post("http://localhost:5000/admin_messages", messageData);
    } catch (error) {
      toast.error("Failed to send message.");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full h-[calc(100vh-80px)] flex flex-col animate-in fade-in duration-500 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-t-3xl shadow-sm border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0 transition-colors">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="text-orange-500" size={28} /> Admin Lounge
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mt-1">
            Private chat room for Club Officers only.
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-gray-50 dark:bg-slate-950/50 p-6 overflow-y-auto custom-scrollbar border-x border-gray-100 dark:border-slate-800 space-y-4 transition-colors">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <MessageSquare size={48} className="mb-4 opacity-50" />
            <p className="font-medium">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = String(msg.userId) === String(user.id);
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%]`}>
                  <div className={`px-5 py-3 rounded-2xl shadow-sm ${isMe ? "bg-violet-600 text-white rounded-br-sm" : "bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-slate-800 rounded-bl-sm"}`}>
                    {!isMe && (
                      <span className="block text-xs font-black text-orange-500 dark:text-orange-400 mb-1">
                        {msg.userName.split(" ")[0]} {/* بيعرض الاسم الأول بس */}
                      </span>
                    )}
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-1 mx-2">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-b-3xl shadow-sm border-t border-gray-100 dark:border-slate-800 shrink-0 transition-colors">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Type a message to the team..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-violet-100 dark:focus:border-violet-900/50 rounded-2xl px-5 py-3.5 outline-none focus:bg-white dark:focus:bg-slate-900 transition-all font-medium text-gray-700 dark:text-white"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white p-3.5 rounded-2xl transition-colors shrink-0 disabled:cursor-not-allowed"
          >
            <Send size={20} className={newMessage.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
          </button>
        </form>
      </div>
    </div>
  );
}