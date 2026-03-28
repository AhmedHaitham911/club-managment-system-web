import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AuthContext } from "../../context/AuthContext";
import {
  Calendar,
  MapPin,
  Users,
  Ticket,
  Search,
  Edit3,
  Trash2,
  Flame,
  X,
  CheckCircle2,
  XCircle,
  Plus,
  Upload,
  Clock, // 🚀 ضفنا أيقونة الساعة هنا للـ Deadline
} from "lucide-react";
import toast from "react-hot-toast";

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height *= MAX_WIDTH / width));
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        resolve(compressedBase64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function Events() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);

  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [eventToRsvp, setEventToRsvp] = useState(null);

  const [userRsvps, setUserRsvps] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsRes = await axios.get("http://localhost:5000/events");
        setEvents(eventsRes.data);

        if (user && user.role !== "Officer") {
          const rsvpsRes = await axios.get("http://localhost:5000/rsvps");
          const myRsvps = rsvpsRes.data.filter(
            (rsvp) => String(rsvp.userId) === String(user.id),
          );
          const rsvpMap = {};
          myRsvps.forEach((rsvp) => {
            rsvpMap[String(rsvp.eventId)] = rsvp.id;
          });
          setUserRsvps(rsvpMap);
        }

        setIsLoading(false);
      } catch (error) {
        toast.error("Oops! Couldn't load events.");
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleImageUpload = async (e, formikInstance) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading("Processing image...");
    try {
      const base64Image = await compressImage(file);
      formikInstance.setFieldValue("image", base64Image);
      toast.success("Image attached successfully!", { id: toastId });
    } catch (error) {
      toast.error("Failed to process image.", { id: toastId });
    }
  };

  const openEditModal = (event) => {
    setEventToEdit(event);
    setIsEditModalOpen(true);
  };

  const openRsvpModal = (event) => {
    if (!user) {
      toast.error("Please Sign In to RSVP for events!");
      return;
    }

    if (event.registeredCount >= event.capacity || event.status === "Full") {
      toast.error("Sorry, this event is fully booked! 🚫");
      return;
    }

    // 🚀 حماية إضافية لو الديدلاين خلص ميفتحش المودال أصلاً
    if (event.deadline && new Date() > new Date(event.deadline)) {
      toast.error("The RSVP deadline has already passed! ⏰");
      return;
    }

    setEventToRsvp(event);
    setIsRsvpModalOpen(true);
  };

  const handleCancelRSVP = async (event) => {
    const eventIdStr = String(event.id);
    const rsvpId = userRsvps[eventIdStr];
    if (!rsvpId) return;

    // 🚀 ممكن نضيف حماية لو عايز تمنع الإلغاء بعد الديدلاين (اختياري، حالياً مسموح يلغي)
    // if (event.deadline && new Date() > new Date(event.deadline)) {
    //   toast.error("Cannot cancel RSVP after the deadline has passed!");
    //   return;
    // }

    const toastId = toast.loading("Canceling your ticket... 🔄");

    try {
      await axios.delete(`http://localhost:5000/rsvps/${rsvpId}`);

      const newCount = Math.max(0, event.registeredCount - 1);
      const updatedEvent = await axios.patch(
        `http://localhost:5000/events/${event.id}`,
        {
          registeredCount: newCount,
          status: "Upcoming",
        },
      );

      setEvents(
        events.map((e) =>
          String(e.id) === String(event.id) ? updatedEvent.data : e,
        ),
      );

      const updatedRsvps = { ...userRsvps };
      delete updatedRsvps[eventIdStr];
      setUserRsvps(updatedRsvps);

      toast.success("Ticket canceled successfully.", { id: toastId });
    } catch (error) {
      toast.error("Failed to cancel ticket. Try again.", { id: toastId });
    }
  };

  const createFormik = useFormik({
    initialValues: {
      title: "",
      description: "",
      date: "",
      deadline: "", // 🚀 ضفنا الديدلاين هنا
      location: "",
      capacity: "",
      image: "",
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Required 📝"),
      description: Yup.string().required("Required 📋"),
      date: Yup.string().required("Required 📅"),
      deadline: Yup.string().required("Required ⏰"), // 🚀 فاليديشن الديدلاين
      location: Yup.string().required("Required 📍"),
      capacity: Yup.number()
        .typeError("Must be a number")
        .min(1)
        .required("Required 👥"),
      image: Yup.string()
        .required("Image is required 🖼️")
        .test(
          "is-url-or-base64",
          "Must be a valid URL or uploaded image",
          (value) => {
            if (!value) return false;
            return value.startsWith("http") || value.startsWith("data:image");
          },
        ),
    }),
    onSubmit: async (values, { resetForm }) => {
      const toastId = toast.loading("Creating event... 🎪");
      try {
        const newEvent = {
          ...values,
          capacity: Number(values.capacity),
          registeredCount: 0,
          status: "Upcoming",
        };
        const response = await axios.post(
          "http://localhost:5000/events",
          newEvent,
        );
        setEvents([...events, response.data]);
        setIsCreateModalOpen(false);
        resetForm();
        toast.success("Event created successfully! 🎉", { id: toastId });
      } catch (error) {
        toast.error("Failed to create event.", { id: toastId });
      }
    },
  });

  const rsvpFormik = useFormik({
    initialValues: { notes: "" },
    onSubmit: async (values, { resetForm }) => {
      if (!eventToRsvp || !user) return;

      const toastId = toast.loading("Securing your ticket... 🎟️");

      try {
        const allRsvpsRes = await axios.get("http://localhost:5000/rsvps");
        const hasAlreadyBooked = allRsvpsRes.data.some(
          (r) =>
            String(r.userId) === String(user.id) &&
            String(r.eventId) === String(eventToRsvp.id),
        );

        if (hasAlreadyBooked) {
          toast.error("You already booked a ticket for this event! 🚫", {
            id: toastId,
          });
          setIsRsvpModalOpen(false);
          return;
        }

        if (eventToRsvp.registeredCount >= eventToRsvp.capacity) {
          toast.error("Event just got fully booked! 🚫", { id: toastId });
          setIsRsvpModalOpen(false);
          return;
        }

        // 🚀 حماية إضافية لو حد ساب المودال مفتوح والديدلاين خلص
        if (
          eventToRsvp.deadline &&
          new Date() > new Date(eventToRsvp.deadline)
        ) {
          toast.error("The RSVP deadline has passed! ⏰", { id: toastId });
          setIsRsvpModalOpen(false);
          return;
        }

        const newCount = eventToRsvp.registeredCount + 1;
        const newStatus =
          newCount >= eventToRsvp.capacity ? "Full" : eventToRsvp.status;

        const updatedEvent = await axios.patch(
          `http://localhost:5000/events/${eventToRsvp.id}`,
          {
            registeredCount: newCount,
            status: newStatus,
          },
        );

        const newRsvp = await axios.post("http://localhost:5000/rsvps", {
          eventId: String(eventToRsvp.id),
          userId: String(user.id),
          studentName: user.name,
          studentId: user.studentId,
          notes: values.notes,
          registrationDate: new Date().toISOString(),
        });

        setEvents(
          events.map((e) =>
            String(e.id) === String(eventToRsvp.id) ? updatedEvent.data : e,
          ),
        );

        setUserRsvps({
          ...userRsvps,
          [String(eventToRsvp.id)]: newRsvp.data.id,
        });

        setIsRsvpModalOpen(false);
        setEventToRsvp(null);
        resetForm();

        toast.success("You're in! Ticket secured. 🎉", { id: toastId });
      } catch (error) {
        toast.error("Failed to RSVP. Please try again.", { id: toastId });
      }
    },
  });

  const editFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: eventToEdit?.title || "",
      description: eventToEdit?.description || "",
      date: eventToEdit?.date || "",
      deadline: eventToEdit?.deadline || "", // 🚀 ضفنا الديدلاين
      location: eventToEdit?.location || "",
      capacity: eventToEdit?.capacity || "",
      image: eventToEdit?.image || "",
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Required 📝"),
      description: Yup.string().required("Required 📋"),
      date: Yup.string().required("Required 📅"),
      deadline: Yup.string().required("Required ⏰"), // 🚀 فاليديشن
      location: Yup.string().required("Required 📍"),
      capacity: Yup.number()
        .typeError("Must be a number")
        .min(1)
        .required("Required 👥"),
      image: Yup.string()
        .required("Image is required 🖼️")
        .test(
          "is-url-or-base64",
          "Must be a valid URL or uploaded image",
          (value) => {
            if (!value) return false;
            return value.startsWith("http") || value.startsWith("data:image");
          },
        ),
    }),
    onSubmit: async (values, { resetForm }) => {
      if (!eventToEdit) return;

      const newCapacity = Number(values.capacity);
      const newStatus =
        eventToEdit.registeredCount >= newCapacity ? "Full" : "Upcoming";

      const updatedEventData = {
        ...eventToEdit,
        ...values,
        capacity: newCapacity,
        status: newStatus,
      };

      try {
        const response = await axios.put(
          `http://localhost:5000/events/${eventToEdit.id}`,
          updatedEventData,
        );
        setEvents(
          events.map((e) =>
            String(e.id) === String(eventToEdit.id) ? response.data : e,
          ),
        );
        setIsEditModalOpen(false);
        setEventToEdit(null);
        resetForm();
        toast.success("Event updated successfully! ✏️");
      } catch (error) {
        toast.error("Failed to update event.");
      }
    },
  });

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab =
      activeTab === "All"
        ? true
        : activeTab === "Upcoming"
          ? event.status === "Upcoming" || event.status === "Full"
          : event.status === "Past";
    return matchesSearch && matchesTab;
  });

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/events/${id}`);
      setEvents(events.filter((e) => String(e.id) !== String(id)));
      toast.success("Event deleted successfully! 🗑️");
    } catch (error) {
      toast.error("Failed to delete event.");
    }
  };

  if (isLoading)
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-slate-950 transition-colors">
        <Flame size={48} className="text-violet-500 animate-bounce mb-4" />
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 animate-pulse">
          Loading amazing events...
        </h2>
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8 relative transition-colors duration-300 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            Campus Events <Calendar className="text-fuchsia-500" size={32} />
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
            Discover, join, and manage club activities.
          </p>
        </div>

        {user?.role === "Officer" && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black py-3 px-6 rounded-2xl hover:shadow-lg hover:shadow-fuchsia-500/30 dark:hover:shadow-fuchsia-900/30 hover:-translate-y-1 transition-all"
          >
            <Plus size={20} /> New Event
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4 transition-colors">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search for workshops, hackathons, games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-violet-100 dark:focus:border-violet-900/50 rounded-2xl pl-12 pr-4 py-3 outline-none focus:bg-white dark:focus:bg-slate-800 transition-all font-medium text-gray-700 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {["All", "Upcoming", "Past"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const eventIdStr = String(event.id);
            const hasRSVPd = !!userRsvps[eventIdStr];

            const isEventFull =
              event.registeredCount >= event.capacity ||
              event.status === "Full";
            // 🚀 بنحسب هل الوقت اتخطى الديدلاين ولا لأ (ولو مفيش ديدلاين بنعتبره لسه متاح للـ backward compatibility)
            const isPastDeadline = event.deadline
              ? new Date() > new Date(event.deadline)
              : false;

            // 🚀 الزرار هيقفل لو الإيفنت اتملى "أو" الديدلاين خلص
            const canNotRSVP = isEventFull || isPastDeadline;

            const progressPercent = Math.min(
              100,
              Math.round((event.registeredCount / event.capacity) * 100) || 0,
            );

            return (
              <div
                key={event.id}
                className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:shadow-violet-100 dark:hover:shadow-slate-800 hover:-translate-y-1 transition-all duration-300 group flex flex-col"
              >
                <div className="h-52 overflow-hidden relative">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-black text-gray-900 dark:text-white shadow-sm text-center">
                    <span className="block text-xs text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </span>
                    {new Date(event.date).getDate()}
                  </div>

                  {isEventFull && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                      <Flame size={12} /> Sold Out
                    </div>
                  )}

                  {hasRSVPd && (
                    <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                      <CheckCircle2 size={12} /> Ticket Secured
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {event.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4 line-clamp-2 leading-relaxed flex-1">
                    {event.description}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300">
                      <div className="bg-violet-50 dark:bg-slate-800 p-2 rounded-lg text-violet-500 dark:text-violet-400">
                        <MapPin size={16} />
                      </div>
                      {event.location}
                    </div>

                    {/* 🚀 عرضنا الديدلاين في الكارت */}
                    {event.deadline && (
                      <div
                        className={`flex items-center gap-3 text-sm font-bold ${isPastDeadline ? "text-red-500 dark:text-red-400" : "text-gray-600 dark:text-gray-300"}`}
                      >
                        <div
                          className={`${isPastDeadline ? "bg-red-50 dark:bg-red-900/30" : "bg-blue-50 dark:bg-slate-800"} p-2 rounded-lg ${isPastDeadline ? "text-red-500" : "text-blue-500 dark:text-blue-400"}`}
                        >
                          <Clock size={16} />
                        </div>
                        RSVP By:{" "}
                        {new Date(event.deadline).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300 pt-1">
                      <div className="bg-orange-50 dark:bg-slate-800 p-2 rounded-lg text-orange-500 dark:text-orange-400">
                        <Users size={16} />
                      </div>
                      <div className="w-full flex items-center justify-between">
                        <span>
                          {event.registeredCount} / {event.capacity} Attendees
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded-md dark:text-white">
                          {progressPercent}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          isEventFull
                            ? "bg-red-500"
                            : "bg-gradient-to-r from-violet-500 to-fuchsia-500"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-100 dark:border-slate-800">
                    {!user && (
                      <button
                        onClick={() => toast.error("Please Sign In to RSVP!")}
                        className="flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                      >
                        <Ticket size={18} /> Sign In to RSVP
                      </button>
                    )}

                    {user?.role === "Member" &&
                      (hasRSVPd ? (
                        <button
                          onClick={() => handleCancelRSVP(event)}
                          className="flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all bg-white dark:bg-slate-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 border-2 border-red-100 dark:border-red-900"
                        >
                          <XCircle size={18} /> Cancel RSVP
                        </button>
                      ) : (
                        <button
                          onClick={() => openRsvpModal(event)}
                          disabled={canNotRSVP} // 🚀 قفلنا الزرار بالمتغير المجمع الجديد
                          className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                            canNotRSVP
                              ? "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                              : "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 dark:hover:text-white"
                          }`}
                        >
                          <Ticket size={18} />{" "}
                          {/* 🚀 أولوية الكلمات: لو مليان يبقى Sold Out، لو الديدلاين خلص يبقى Deadline Passed، غير كده RSVP Now */}
                          {isEventFull
                            ? "Sold Out"
                            : isPastDeadline
                              ? "Deadline Passed"
                              : "RSVP Now"}
                        </button>
                      ))}

                    {user?.role === "Officer" && (
                      <>
                        <button
                          onClick={() => openEditModal(event)}
                          className="flex-1 py-3 flex items-center justify-center gap-2 font-black text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-600 hover:text-white rounded-xl transition-colors dark:text-blue-300"
                        >
                          <Edit3 size={18} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="flex-1 py-3 flex items-center justify-center gap-2 font-black text-sm text-red-600 bg-red-50 dark:bg-red-950/50 hover:bg-red-600 hover:text-white rounded-xl transition-colors dark:text-red-300"
                        >
                          <Trash2 size={18} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
          <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-full mb-4">
            <Search size={48} className="text-gray-300 dark:text-slate-600" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
            No events found
          </h3>
        </div>
      )}

      {/* 🎟️ RSVP Modal */}
      {isRsvpModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Ticket className="text-violet-500" size={24} /> Get Your Ticket
              </h2>
              <button
                onClick={() => {
                  setIsRsvpModalOpen(false);
                  setEventToRsvp(null);
                  rsvpFormik.resetForm();
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={rsvpFormik.handleSubmit} className="p-6 space-y-4">
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  You are RSVPing for:{" "}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {eventToRsvp?.title}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Any special notes or dietary requirements? (Optional)
                </label>
                <textarea
                  name="notes"
                  rows="3"
                  placeholder="e.g. Vegetarian, need wheelchair access..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white outline-none transition-colors resize-none"
                  value={rsvpFormik.values.notes}
                  onChange={rsvpFormik.handleChange}
                ></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsRsvpModalOpen(false);
                    setEventToRsvp(null);
                    rsvpFormik.resetForm();
                  }}
                  className="px-6 py-3 font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rsvpFormik.isSubmitting}
                  className="px-6 py-3 font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  Confirm RSVP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🎪 Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="text-violet-500" size={24} /> Create New Event
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  createFormik.resetForm();
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={createFormik.handleSubmit}
              className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    placeholder="e.g., Spring Hackathon"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      createFormik.touched.title && createFormik.errors.title
                        ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                        : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                    } outline-none transition-colors`}
                    value={createFormik.values.title}
                    onChange={createFormik.handleChange}
                    onBlur={createFormik.handleBlur}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Event Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="date"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      createFormik.touched.date && createFormik.errors.date
                        ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                        : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                    } outline-none transition-colors`}
                    value={createFormik.values.date}
                    onChange={createFormik.handleChange}
                    onBlur={createFormik.handleBlur}
                  />
                </div>

                {/* 🚀 ضفنا الديدلاين هنا */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    RSVP Deadline
                  </label>
                  <input
                    type="datetime-local"
                    name="deadline"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      createFormik.touched.deadline &&
                      createFormik.errors.deadline
                        ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                        : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                    } outline-none transition-colors`}
                    value={createFormik.values.deadline}
                    onChange={createFormik.handleChange}
                    onBlur={createFormik.handleBlur}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g., Main Hall"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      createFormik.touched.location &&
                      createFormik.errors.location
                        ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                        : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                    } outline-none transition-colors`}
                    value={createFormik.values.location}
                    onChange={createFormik.handleChange}
                    onBlur={createFormik.handleBlur}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    placeholder="e.g., 100"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      createFormik.touched.capacity &&
                      createFormik.errors.capacity
                        ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                        : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                    } outline-none transition-colors`}
                    value={createFormik.values.capacity}
                    onChange={createFormik.handleChange}
                    onBlur={createFormik.handleBlur}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Event Image (URL or Upload)
                  </label>
                  {createFormik.values.image?.startsWith("data:image") ? (
                    <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-900/30 border-2 border-violet-100 dark:border-violet-800 rounded-xl">
                      <span className="text-sm font-bold text-violet-700 dark:text-violet-300 flex items-center gap-2">
                        <CheckCircle2 size={18} /> Image Uploaded from Device
                      </span>
                      <button
                        type="button"
                        onClick={() => createFormik.setFieldValue("image", "")}
                        className="text-red-500 hover:text-red-600 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        name="image"
                        placeholder="Paste image URL here..."
                        className={`flex-1 px-4 py-3 rounded-xl border-2 ${
                          createFormik.touched.image &&
                          createFormik.errors.image
                            ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                            : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                        } outline-none transition-colors`}
                        value={createFormik.values.image}
                        onChange={createFormik.handleChange}
                        onBlur={createFormik.handleBlur}
                      />
                      <label
                        className="cursor-pointer bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 p-3.5 rounded-xl transition-colors flex items-center justify-center"
                        title="Upload from device"
                      >
                        <Upload size={20} />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, createFormik)}
                        />
                      </label>
                    </div>
                  )}
                  {createFormik.values.image && !createFormik.errors.image && (
                    <img
                      src={createFormik.values.image}
                      className="mt-3 h-32 w-full object-cover rounded-xl border border-gray-100 dark:border-slate-700"
                      alt="Preview"
                    />
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="4"
                    placeholder="Event details..."
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      createFormik.touched.description &&
                      createFormik.errors.description
                        ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                        : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                    } outline-none transition-colors resize-none`}
                    value={createFormik.values.description}
                    onChange={createFormik.handleChange}
                    onBlur={createFormik.handleBlur}
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    createFormik.resetForm();
                  }}
                  className="px-6 py-3 font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createFormik.isSubmitting || !createFormik.isValid}
                  className="px-6 py-3 font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✏️ Edit Event Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Edit3 className="text-blue-500" size={24} /> Edit Event
              </h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEventToEdit(null);
                  editFormik.resetForm();
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={editFormik.handleSubmit}
              className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      editFormik.touched.title && editFormik.errors.title
                        ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                        : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                    } outline-none transition-colors`}
                    value={editFormik.values.title}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Event Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="date"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      editFormik.touched.date && editFormik.errors.date
                        ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                        : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                    } outline-none transition-colors`}
                    value={editFormik.values.date}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                  />
                </div>

                {/* 🚀 ضفنا الديدلاين هنا للـ Edit برضه */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    RSVP Deadline
                  </label>
                  <input
                    type="datetime-local"
                    name="deadline"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      editFormik.touched.deadline && editFormik.errors.deadline
                        ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                        : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                    } outline-none transition-colors`}
                    value={editFormik.values.deadline}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      editFormik.touched.location && editFormik.errors.location
                        ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                        : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                    } outline-none transition-colors`}
                    value={editFormik.values.location}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      editFormik.touched.capacity && editFormik.errors.capacity
                        ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                        : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                    } outline-none transition-colors`}
                    value={editFormik.values.capacity}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Event Image (URL or Upload)
                  </label>
                  {editFormik.values.image?.startsWith("data:image") ? (
                    <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-900/30 border-2 border-violet-100 dark:border-violet-800 rounded-xl">
                      <span className="text-sm font-bold text-violet-700 dark:text-violet-300 flex items-center gap-2">
                        <CheckCircle2 size={18} /> Image Uploaded from Device
                      </span>
                      <button
                        type="button"
                        onClick={() => editFormik.setFieldValue("image", "")}
                        className="text-red-500 hover:text-red-600 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        name="image"
                        placeholder="Paste image URL here..."
                        className={`flex-1 px-4 py-3 rounded-xl border-2 ${
                          editFormik.touched.image && editFormik.errors.image
                            ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                            : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                        } outline-none transition-colors`}
                        value={editFormik.values.image}
                        onChange={editFormik.handleChange}
                        onBlur={editFormik.handleBlur}
                      />
                      <label
                        className="cursor-pointer bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 p-3.5 rounded-xl transition-colors flex items-center justify-center"
                        title="Upload from device"
                      >
                        <Upload size={20} />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, editFormik)}
                        />
                      </label>
                    </div>
                  )}
                  {editFormik.values.image && !editFormik.errors.image && (
                    <img
                      src={editFormik.values.image}
                      className="mt-3 h-32 w-full object-cover rounded-xl border border-gray-100 dark:border-slate-700"
                      alt="Preview"
                    />
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="4"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      editFormik.touched.description &&
                      editFormik.errors.description
                        ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                        : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-violet-500 dark:text-white"
                    } outline-none transition-colors resize-none`}
                    value={editFormik.values.description}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEventToEdit(null);
                    editFormik.resetForm();
                  }}
                  className="px-6 py-3 font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editFormik.isSubmitting || !editFormik.isValid}
                  className="px-6 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
