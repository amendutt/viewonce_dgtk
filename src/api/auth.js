import client from "./client";

export const authApi = {
  login: (mobile, password) =>
    client.post("/auth/login", { mobile, password }),

  me: () => client.get("/auth/me"),

  logout: () => client.post("/auth/logout"),

  changePassword: (currentPassword, newPassword) =>
    client.put("/auth/change-password", { currentPassword, newPassword }),

  refresh: (refreshToken) =>
    client.post("/auth/refresh", { refreshToken }),

  register: (data) =>
    client.post("/auth/register", data),
};
