const roleMap = {
  admin: "Officer",
  user: "Member",
  Officer: "Officer",
  Member: "Member",
};

const backendRoleMap = {
  Officer: "admin",
  Member: "user",
  admin: "admin",
  user: "user",
};

const statusMap = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  Approved: "Approved",
  Pending: "Pending",
  Rejected: "Rejected",
};

export const toFrontendRole = (role) => roleMap[role] || "Member";

export const toBackendRole = (role) => backendRoleMap[role] || "user";

export const toFrontendStatus = (status) => statusMap[status] || "Pending";

export const normalizeUser = (rawUser) => {
  if (!rawUser) return null;

  const id = rawUser._id || rawUser.id || "";
  const role = toFrontendRole(rawUser.role);
  const backendRole = toBackendRole(rawUser.role);

  return {
    ...rawUser,
    id,
    _id: id,
    name: rawUser.displayName || rawUser.name || "",
    displayName: rawUser.displayName || rawUser.name || "",
    avatar: rawUser.profileImageUrl || rawUser.avatar || "",
    profileImageUrl: rawUser.profileImageUrl || rawUser.avatar || "",
    role,
    backendRole,
    status: toFrontendStatus(rawUser.status),
  };
};

export const normalizeUsers = (users) =>
  Array.isArray(users) ? users.map(normalizeUser).filter(Boolean) : [];
