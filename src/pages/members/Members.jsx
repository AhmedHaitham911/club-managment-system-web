import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Users, CheckCircle2, XCircle, Shield, Calendar, Upload } from "lucide-react";
import { AuthContext } from "../../context/auth-context";
import { api, getErrorMessage, unwrapData } from "../../lib/api";
import { normalizeUsers } from "../../lib/auth-user";

export default function Members() {
  const { user } = useContext(AuthContext);
  const isOfficer = user?.role === "Officer";

  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [attendees, setAttendees] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [csvInputKey, setCsvInputKey] = useState(0);
  const [importSummary, setImportSummary] = useState(null);

  const loadMembers = useCallback(async () => {
    const res = await api.get("/admin/users?limit=200");
    setMembers(normalizeUsers(unwrapData(res) || []));
  }, []);

  const loadEvents = useCallback(async () => {
    const res = await api.get("/events?limit=200");
    const rows = unwrapData(res) || [];
    setEvents(rows);
    if (rows.length && !selectedEventId) {
      setSelectedEventId(String(rows[0]._id));
    }
  }, [selectedEventId]);

  const loadAttendees = useCallback(async (eventId) => {
    if (!eventId) return;
    const res = await api.get(`/events/${eventId}/attendees?limit=200`);
    setAttendees(unwrapData(res) || []);
  }, []);

  useEffect(() => {
    if (!isOfficer) return;

    Promise.all([loadMembers(), loadEvents()]).catch((error) => {
      toast.error(getErrorMessage(error, "Failed to load members."));
    });
  }, [isOfficer, loadEvents, loadMembers]);

  useEffect(() => {
    if (!isOfficer || !selectedEventId) return;
    loadAttendees(selectedEventId).catch((error) => {
      toast.error(getErrorMessage(error, "Failed to load attendees."));
    });
  }, [isOfficer, loadAttendees, selectedEventId]);

  const pending = useMemo(
    () => members.filter((m) => m.status === "Pending"),
    [members]
  );

  const approved = useMemo(
    () => members.filter((m) => m.status === "Approved"),
    [members]
  );

  const onApprove = async (id) => {
    const toastId = toast.loading("Approving...");
    try {
      await api.patch(`/admin/users/${id}/approve`);
      await loadMembers();
      toast.success("Approved.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "Approve failed."), { id: toastId });
    }
  };

  const onReject = async (id) => {
    const toastId = toast.loading("Rejecting...");
    try {
      await api.patch(`/admin/users/${id}/reject`);
      await loadMembers();
      toast.success("Rejected.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "Reject failed."), { id: toastId });
    }
  };

  const onPromote = async (id) => {
    const toastId = toast.loading("Promoting...");
    try {
      await api.patch(`/admin/users/${id}/promote`);
      await loadMembers();
      toast.success("Promoted to admin.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "Promote failed."), { id: toastId });
    }
  };

  const onImportCsv = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error("Select a CSV file first.");
      return;
    }

    const toastId = toast.loading("Importing members CSV...");
    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      const res = await api.post("/admin/users/import-csv", formData);
      const summary = unwrapData(res) || null;
      setImportSummary(summary);
      await loadMembers();
      setCsvFile(null);
      setCsvInputKey((prev) => prev + 1);
      toast.success("CSV imported successfully.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, "CSV import failed."), { id: toastId });
    }
  };

  if (!isOfficer) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="p-6 rounded-2xl bg-yellow-50 text-yellow-700 border border-yellow-200">
          Members management is available only for admins.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
        <Users className="text-orange-500" /> Members Management
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form
          onSubmit={onImportCsv}
          className="lg:col-span-2 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900"
        >
          <h2 className="font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Upload size={18} /> Import Members CSV
          </h2>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              key={csvInputKey}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold"
            >
              Import CSV
            </button>
          </div>
          {importSummary && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Imported: created {importSummary.created || 0}, updated {importSummary.updated || 0}, skipped{" "}
              {importSummary.skipped || 0}, failed {(importSummary.failed || []).length}.
            </div>
          )}
        </form>

        <div className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h2 className="font-black text-gray-900 dark:text-white mb-3">Pending Requests</h2>
          <div className="space-y-3">
            {pending.map((m) => (
              <div key={m.id} className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800">
                <div className="font-bold text-gray-900 dark:text-white">{m.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{m.email}</div>
                <div className="flex gap-2">
                  <button onClick={() => onApprove(m.id)} className="px-3 py-1 rounded-lg bg-green-50 text-green-700 text-sm font-bold flex items-center gap-1"><CheckCircle2 size={14} /> Approve</button>
                  <button onClick={() => onReject(m.id)} className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-sm font-bold flex items-center gap-1"><XCircle size={14} /> Reject</button>
                </div>
              </div>
            ))}
            {!pending.length && <div className="text-sm text-gray-500 dark:text-gray-400">No pending users.</div>}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h2 className="font-black text-gray-900 dark:text-white mb-3">Approved Members</h2>
          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {approved.map((m) => (
              <div key={m.id} className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">{m.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{m.email} - {m.role}</div>
                </div>
                {m.role !== "Officer" && (
                  <button onClick={() => onPromote(m.id)} className="px-3 py-1 rounded-lg bg-violet-50 text-violet-700 text-sm font-bold flex items-center gap-1">
                    <Shield size={14} /> Promote
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <h2 className="font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Calendar size={18} /> Event Attendees</h2>
        <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="w-full md:w-auto px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white mb-4">
          {events.map((e) => (
            <option key={e._id} value={e._id}>{e.title}</option>
          ))}
        </select>

        <div className="space-y-2">
          {attendees.map((a) => (
            <div key={a.rsvpId} className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800">
              <div className="font-bold text-gray-900 dark:text-white">{a.member?.displayName || "Member"}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{a.member?.email}</div>
            </div>
          ))}
          {!attendees.length && <div className="text-sm text-gray-500 dark:text-gray-400">No attendees found for this event.</div>}
        </div>
      </div>
    </div>
  );
}
