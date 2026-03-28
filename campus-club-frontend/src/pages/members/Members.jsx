import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import {
  Users,
  Calendar,
  Award,
  Shield,
  User,
  Search,
  X,
  Flame,
  MapPin,
  Ticket,
  Trash2,
  CheckCircle2,
  XCircle,
  MailWarning,
  Settings
} from "lucide-react";
import toast from "react-hot-toast";

export default function Members() {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Directory");

  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

  // 🚀 حالة بنخزن فيها الرتبة اللي الأدمن بيختارها لكل طلب
  const [assignedRoles, setAssignedRoles] = useState({});

  const getAvatar = (id, avatarUrl) =>
    avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}&backgroundColor=b6e3f4`;

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [usersRes, eventsRes, rsvpsRes] = await Promise.all([
          axios.get("http://localhost:5000/users"),
          axios.get("http://localhost:5000/events"),
          axios.get("http://localhost:5000/rsvps"),
        ]);

        setUsers(usersRes.data);
        setEvents(eventsRes.data);
        setRsvps(rsvpsRes.data);

        if (eventsRes.data.length > 0) {
          setSelectedEventId(String(eventsRes.data[0].id));
        }
        setIsLoading(false);
      } catch (error) {
        toast.error("Oops! Couldn't load members data.");
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const getUserRsvpCount = (userId) => {
    return rsvps.filter((r) => String(r.userId) === String(userId)).length;
  };

  const getUserEvents = (userId) => {
    const userRsvps = rsvps.filter((r) => String(r.userId) === String(userId));
    return userRsvps
      .map((rsvp) => events.find((e) => String(e.id) === String(rsvp.eventId)))
      .filter(Boolean);
  };

  const getEventAttendees = (eventId) => {
    const eventRsvps = rsvps.filter(
      (r) => String(r.eventId) === String(eventId),
    );
    let attendees = eventRsvps
      .map((rsvp) => users.find((u) => String(u.id) === String(rsvp.userId)))
      .filter(Boolean);
    
    if (currentUser?.role !== "Officer") {
      attendees = attendees.filter((u) => u.role !== "Officer");
    }
    return attendees;
  };

  // 🚀 تحديث دالة القبول عشان تبعت الرتبة اللي الأدمن حددها
  const handleApproveRequest = async (id, name) => {
    const roleToAssign = assignedRoles[id] || "Member"; // Member هي الافتراضي
    const toastId = toast.loading(`Approving ${name} as ${roleToAssign}...`);
    
    try {
      await axios.patch(`http://localhost:5000/users/${id}`, { status: "Approved", role: roleToAssign });
      setUsers(users.map(u => String(u.id) === String(id) ? { ...u, status: "Approved", role: roleToAssign } : u));
      toast.success(`${name} is now a ${roleToAssign}! Email sent. 📩`, { id: toastId });
    } catch (error) {
      toast.error("Failed to approve.", { id: toastId });
    }
  };

  const handleRejectOrDelete = async (id, name, isRequest = false) => {
    const toastId = toast.loading(isRequest ? "Rejecting request..." : "Removing member...");
    try {
      await axios.delete(`http://localhost:5000/users/${id}`);
      setUsers(users.filter(u => String(u.id) !== String(id)));
      toast.success(isRequest ? `Request from ${name} rejected.` : `${name} removed from club.`, { id: toastId });
    } catch (error) {
      toast.error("Action failed.", { id: toastId });
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isVisible = currentUser?.role === "Officer" ? true : u.role === "Member";
    const isApproved = u.status === "Approved" || !u.status; 
    return matchesSearch && isVisible && isApproved;
  });

  const officerMembers = filteredUsers.filter((u) => u.role === "Officer");
  const regularMembers = filteredUsers.filter((u) => u.role === "Member");
  
  const pendingRequests = users.filter((u) => u.status === "Pending");

  if (isLoading)
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-slate-950 transition-colors">
        <Users size={48} className="text-violet-500 animate-bounce mb-4" />
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 animate-pulse">
          Loading club members...
        </h2>
      </div>
    );

  const UserCard = ({ member }) => {
    const rsvpCount = getUserRsvpCount(member.id);
    const isCurrentUser = currentUser?.id === member.id;

    return (
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-violet-100 dark:hover:shadow-violet-900/20 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group">
        {currentUser?.role === "Officer" && !isCurrentUser && (
          <button 
            onClick={(e) => { e.stopPropagation(); handleRejectOrDelete(member.id, member.name, false); }}
            className="absolute top-4 right-4 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100"
            title="Remove Member"
          >
            <Trash2 size={16} />
          </button>
        )}

        <div className="relative mb-4">
          <div
            className={`w-20 h-20 rounded-full p-1 ${member.role === "Officer" ? "bg-gradient-to-tr from-orange-400 to-pink-500" : "bg-gray-200 dark:bg-slate-700"}`}
          >
            <img
              src={getAvatar(member.id, member.avatar)}
              alt="Avatar"
              className="w-full h-full rounded-full bg-white object-cover"
              onError={(e) => (e.target.src = getAvatar(member.id, ""))}
            />
          </div>
          <div
            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1 shadow-md ${member.role === "Officer" ? "bg-orange-500" : "bg-gray-400 dark:bg-slate-600"}`}
          >
            {member.role === "Officer" ? (
              <Shield size={10} />
            ) : (
              <User size={10} />
            )}
            {member.role}
          </div>
        </div>

        <h3 className="text-lg font-black text-gray-900 dark:text-white mt-2 line-clamp-1">
          {member.name}
        </h3>

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-bold">
          <Flame size={14} className="text-orange-500" />
          Joined {rsvpCount} Event{rsvpCount !== 1 && "s"}
        </div>

        <button
          onClick={() => setSelectedMember(member)}
          className="mt-6 w-full py-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-violet-600 dark:hover:bg-violet-600 hover:text-white text-gray-600 dark:text-gray-300 font-bold rounded-xl text-sm transition-colors"
        >
          View Profile
        </button>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            Club Community <Users className="text-orange-500" size={32} />
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
            Connect with your peers and see who's attending what.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4 transition-colors">
        <div className="flex items-center gap-2 w-full md:w-auto p-1 bg-gray-50 dark:bg-slate-950 rounded-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab("Directory")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === "Directory" ? "bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
          >
            Club Directory
          </button>
          <button
            onClick={() => setActiveTab("Rosters")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === "Rosters" ? "bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
          >
            Event Rosters
          </button>
          {currentUser?.role === "Officer" && (
            <button
              onClick={() => setActiveTab("Requests")}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all relative ${activeTab === "Requests" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
            >
              Join Requests
              {pendingRequests.length > 0 && (
                <span className="absolute top-0 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900"></span>
              )}
            </button>
          )}
        </div>

        {activeTab === "Directory" && (
          <div className="relative flex-1 w-full ml-auto md:max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search members by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border-2 border-gray-100 dark:border-slate-800 focus:border-violet-100 dark:focus:border-violet-900 rounded-2xl pl-11 pr-4 py-2.5 outline-none transition-all font-medium text-sm text-gray-700 dark:text-gray-200"
            />
          </div>
        )}
      </div>

      {activeTab === "Directory" && (
        <div className="space-y-8">
          {currentUser?.role === "Officer" && officerMembers.length > 0 && (
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b-2 border-orange-100 dark:border-orange-900/30 pb-2 inline-flex">
                <Shield className="text-orange-500" size={24} /> Club Officers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {officerMembers.map((member) => (
                  <UserCard key={member.id} member={member} />
                ))}
              </div>
            </div>
          )}

          {regularMembers.length > 0 && (
            <div>
              {currentUser?.role === "Officer" && (
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b-2 border-violet-100 dark:border-violet-900/30 pb-2 inline-flex">
                  <User className="text-violet-500" size={24} /> Club Members
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {regularMembers.map((member) => (
                  <UserCard key={member.id} member={member} />
                ))}
              </div>
            </div>
          )}

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400 font-medium">
              No members found matching your search.
            </div>
          )}
        </div>
      )}

      {activeTab === "Requests" && currentUser?.role === "Officer" && (
        <div>
          {pendingRequests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingRequests.map((req) => (
                <div key={req.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 mb-3 border-2 border-blue-100 dark:border-blue-900/50">
                    <img
                      src={getAvatar(req.id, "")}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white line-clamp-1">{req.name}</h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{req.studentId}</p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 font-bold mb-4 truncate w-full px-2">{req.email}</p>
                  
                  {/* 🚀 القائمة المنسدلة لاختيار الرتبة */}
                  <div className="w-full mb-6 bg-gray-50 dark:bg-slate-950 p-3 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5 justify-center">
                      <Settings size={14} /> Assign Role:
                    </label>
                    <select 
                      className="w-full bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors cursor-pointer"
                      value={assignedRoles[req.id] || "Member"}
                      onChange={(e) => setAssignedRoles({...assignedRoles, [req.id]: e.target.value})}
                    >
                      <option value="Member">Member</option>
                      <option value="Officer">Officer</option>
                    </select>
                  </div>
                  
                  <div className="w-full flex gap-3 mt-auto">
                    <button 
                      onClick={() => handleApproveRequest(req.id, req.name)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 font-bold rounded-xl transition-colors"
                    >
                      <CheckCircle2 size={16} /> Approve
                    </button>
                    <button 
                      onClick={() => handleRejectOrDelete(req.id, req.name, true)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold rounded-xl transition-colors"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center">
              <MailWarning size={48} className="text-gray-300 dark:text-slate-700 mb-4" />
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No pending requests</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium">All new member applications have been reviewed.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "Rosters" && (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-1/3 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm h-[600px] overflow-y-auto custom-scrollbar transition-colors">
            <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 px-2">
              Select an Event
            </h3>
            <div className="space-y-2">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEventId(String(event.id))}
                  className={`w-full text-left p-4 rounded-2xl transition-all flex flex-col gap-2 ${selectedEventId === String(event.id) ? "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/50 border shadow-sm" : "bg-transparent border border-transparent hover:bg-gray-50 dark:hover:bg-slate-800"}`}
                >
                  <h4
                    className={`font-black line-clamp-1 ${selectedEventId === String(event.id) ? "text-orange-600 dark:text-orange-400" : "text-gray-700 dark:text-gray-300"}`}
                  >
                    {event.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />{" "}
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1 bg-white dark:bg-slate-950 px-2 py-1 rounded-md shadow-sm">
                      <Users size={12} className="text-violet-500 dark:text-violet-400" />{" "}
                      {event.registeredCount} RSVPs
                    </span>
                  </div>
                </button>
              ))}
              {events.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  No events found.
                </p>
              )}
            </div>
          </div>

          <div className="w-full lg:w-2/3 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 shadow-sm min-h-[600px] transition-colors">
            {selectedEventId ? (
              <>
                <div className="mb-8 pb-6 border-b border-gray-100 dark:border-slate-800">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                    {
                      events.find((e) => String(e.id) === selectedEventId)
                        ?.title
                    }
                  </h2>
                  <div className="flex items-center gap-4 text-sm font-bold text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={16} className="text-violet-500" />{" "}
                      {
                        events.find((e) => String(e.id) === selectedEventId)
                          ?.location
                      }
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-black text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                  <Ticket className="text-orange-500" size={20} /> Registered
                  Attendees
                </h3>

                {getEventAttendees(selectedEventId).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {getEventAttendees(selectedEventId).map((attendee) => (
                      <div
                        key={attendee.id}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => setSelectedMember(attendee)}
                      >
                        <img
                          src={getAvatar(attendee.id, attendee.avatar)}
                          alt="Avatar"
                          className="w-12 h-12 rounded-full bg-white object-cover border border-gray-200 dark:border-slate-600"
                          onError={(e) =>
                            (e.target.src = getAvatar(attendee.id, ""))
                          }
                        />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white line-clamp-1">
                            {attendee.name}
                          </p>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            {attendee.role === "Officer" && (
                              <Shield size={10} className="text-orange-500" />
                            )}{" "}
                            {attendee.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-400 dark:text-gray-500 font-medium flex flex-col items-center">
                    <Users
                      size={48}
                      className="text-gray-200 dark:text-slate-700 mb-4"
                    />
                    {currentUser?.role === "Officer" 
                      ? "No one has registered for this event yet." 
                      : "No regular members have registered for this event yet."}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 font-bold">
                Please select an event from the list.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Profile */}
      {selectedMember && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative transition-colors">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-800 dark:text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>

            <div
              className={`h-32 relative ${selectedMember.role === "Officer" ? "bg-gradient-to-r from-orange-400 to-pink-500" : "bg-gradient-to-r from-violet-500 to-fuchsia-500"}`}
            >
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <div className="w-24 h-24 rounded-full p-1.5 bg-white dark:bg-slate-900 shadow-lg">
                  <img
                    src={getAvatar(selectedMember.id, selectedMember.avatar)}
                    alt="Avatar"
                    className="w-full h-full rounded-full bg-gray-50 dark:bg-slate-800 object-cover"
                    onError={(e) =>
                      (e.target.src = getAvatar(selectedMember.id, ""))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="pt-16 pb-8 px-8 text-center">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                {selectedMember.name}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-1 mb-6 text-sm font-bold text-gray-500 dark:text-gray-400">
                {selectedMember.role === "Officer" ? (
                  <Shield size={16} className="text-orange-500" />
                ) : (
                  <User size={16} className="text-violet-500" />
                )}
                {selectedMember.role} of CampusClub
              </div>

              <div className="bg-gray-50 dark:bg-slate-950 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 text-left transition-colors">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1">
                  <Award size={14} /> Activity Highlights
                </h3>

                <div className="flex items-center justify-between mb-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-50 dark:border-slate-800 shadow-sm transition-colors">
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                    Events Joined
                  </span>
                  <span className="text-sm font-black text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-md">
                    {getUserRsvpCount(selectedMember.id)}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 px-1">
                    Recently Registered For:
                  </p>
                  {getUserEvents(selectedMember.id).length > 0 ? (
                    getUserEvents(selectedMember.id)
                      .slice(0, 3)
                      .map((event) => (
                        <div
                          key={event.id}
                          className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-gray-50 dark:border-slate-800 shadow-sm transition-colors"
                        >
                          <Calendar size={14} className="text-orange-500" />
                          <span className="line-clamp-1">{event.title}</span>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm font-medium text-gray-400 dark:text-gray-500 italic px-1">
                      Hasn't joined any events yet.
                    </p>
                  )}
                  {getUserEvents(selectedMember.id).length > 3 && (
                    <p className="text-xs text-center text-gray-400 font-bold mt-2">
                      + {getUserEvents(selectedMember.id).length - 3} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}