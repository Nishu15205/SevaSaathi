const API_BASE = "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ message: string; user: { id: string; email: string; name: string; phone: string; role: string; avatarUrl?: string | null; subscription?: string } }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (data: { name: string; email: string; phone: string; password: string; role: "FAMILY" | "CAREGIVER" }) =>
      request<{ message: string; user: { id: string; email: string; name: string; phone: string; role: string } }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    me: (userId: string) =>
      request<{ user: import("@/stores/authStore").User }>(`/api/auth/me?userId=${userId}`),
    sendOtp: (email: string, purpose: "REGISTER" | "RESET_PASSWORD") =>
      request<{ message: string; otp: string; expiresIn: string }>("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email, purpose }),
      }),
    verifyOtp: (email: string, otp: string, purpose: "REGISTER" | "RESET_PASSWORD") =>
      request<{ message: string; verified: boolean }>("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp, purpose }),
      }),
  },
  patients: {
    list: (familyId: string) =>
      request<{ patients: any[] }>(`/api/patients?familyId=${familyId}`),
    create: (data: any) =>
      request<{ patient: any }>("/api/patients", { method: "POST", body: JSON.stringify(data) }),
  },
  caregivers: {
    list: (params: { city?: string; skill?: string; isVerified?: string; minRating?: string; page?: number; limit?: number } = {}) => {
      const sp = new URLSearchParams();
      if (params.city) sp.set("city", params.city);
      if (params.skill) sp.set("skill", params.skill);
      if (params.isVerified) sp.set("isVerified", params.isVerified);
      if (params.minRating) sp.set("minRating", params.minRating);
      if (params.page) sp.set("page", String(params.page));
      if (params.limit) sp.set("limit", String(params.limit));
      return request<{ caregivers: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/caregivers?${sp}`);
    },
    search: (params: { city?: string; skills?: string; shiftType?: string; date?: string; patientAge?: number; mobilityStatus?: string }) => {
      const sp = new URLSearchParams();
      if (params.city) sp.set("city", params.city);
      if (params.skills) sp.set("skills", params.skills);
      if (params.shiftType) sp.set("shiftType", params.shiftType);
      if (params.date) sp.set("date", params.date);
      if (params.patientAge) sp.set("patientAge", String(params.patientAge));
      if (params.mobilityStatus) sp.set("mobilityStatus", params.mobilityStatus);
      return request<{ results: any[]; total: number }>(`/api/search?${sp}`);
    },
    create: (data: any) =>
      request<{ caregiver: any }>('/api/caregivers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<{ caregiver: any }>(`/api/caregivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  bookings: {
    list: (params: { familyId?: string; caregiverId?: string; status?: string; page?: number } = {}) => {
      const sp = new URLSearchParams();
      if (params.familyId) sp.set("familyId", params.familyId);
      if (params.caregiverId) sp.set("caregiverId", params.caregiverId);
      if (params.status) sp.set("status", params.status);
      if (params.page) sp.set("page", String(params.page));
      return request<{ bookings: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/bookings?${sp}`);
    },
    create: (data: any) =>
      request<{ booking: any }>("/api/bookings", { method: "POST", body: JSON.stringify(data) }),
    updateStatus: (id: string, data: { status: string; cancellationReason?: string }) =>
      request<{ booking: any }>(`/api/bookings/${id}/status`, { method: "PUT", body: JSON.stringify(data) }),
  },
  reports: {
    list: (params: { bookingId?: string; caregiverId?: string } = {}) => {
      const sp = new URLSearchParams();
      if (params.bookingId) sp.set("bookingId", params.bookingId);
      if (params.caregiverId) sp.set("caregiverId", params.caregiverId);
      return request<{ reports: any[] }>(`/api/reports?${sp}`);
    },
    create: (data: any) =>
      request<{ report: any }>("/api/reports", { method: "POST", body: JSON.stringify(data) }),
  },
  reviews: {
    list: (params: { caregiverId?: string; familyId?: string } = {}) => {
      const sp = new URLSearchParams();
      if (params.caregiverId) sp.set("caregiverId", params.caregiverId);
      if (params.familyId) sp.set("familyId", params.familyId);
      return request<{ reviews: any[] }>(`/api/reviews?${sp}`);
    },
    listAll: () =>
      request<{ reviews: any[] }>("/api/reviews"),
    create: (data: any) =>
      request<{ review: any }>("/api/reviews", { method: "POST", body: JSON.stringify(data) }),
  },
  notifications: {
    list: (userId: string) =>
      request<{ notifications: any[] }>(`/api/notifications?userId=${userId}`),
  },
  complaints: {
    list: (params: { familyId?: string; caregiverId?: string; status?: string } = {}) => {
      const sp = new URLSearchParams();
      if (params.familyId) sp.set("familyId", params.familyId);
      if (params.caregiverId) sp.set("caregiverId", params.caregiverId);
      if (params.status) sp.set("status", params.status);
      return request<{ complaints: any[] }>(`/api/complaints?${sp}`);
    },
    listAll: () =>
      request<{ complaints: any[] }>("/api/complaints"),
    create: (data: any) =>
      request<{ complaint: any }>("/api/complaints", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: { status: string; resolution?: string; assignedTo?: string }) =>
      request<{ complaint: any }>(`/api/complaints/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },
  admin: {
    dashboard: () =>
      request<any>("/api/admin/dashboard"),
    users: (params?: { role?: string; page?: number; limit?: number; search?: string }) => {
      const sp = new URLSearchParams();
      if (params?.role) sp.set("role", params.role);
      if (params?.page) sp.set("page", String(params.page));
      if (params?.limit) sp.set("limit", String(params.limit));
      if (params?.search) sp.set("search", params.search);
      return request<{ users: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/admin/users?${sp}`);
    },
    getUser: (userId: string) =>
      request<any>(`/api/admin/users/${userId}`),
    deleteUser: (userId: string) =>
      request<any>(`/api/admin/users/${userId}`, { method: 'DELETE' }),
    bookings: (params?: { search?: string; page?: number; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.search) sp.set('search', params.search);
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      return request<any>(`/api/admin/bookings?${sp.toString()}`);
    },
    verifications: {
      list: (params?: { search?: string; status?: string }) => {
        const sp = new URLSearchParams();
        if (params?.search) sp.set('search', params.search);
        if (params?.status) sp.set('status', params.status);
        return request<{ verifications: any[] }>(`/api/admin/verifications?${sp.toString()}`);
      },
      update: (id: string, data: { status: string; rejectionReason?: string }) =>
        request<{ verification: any }>(`/api/admin/verifications/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    },
  },
  payments: {
    list: (userId: string, role: 'FAMILY' | 'CAREGIVER') =>
      request<{ payments: any[] }>(`/api/payments?userId=${userId}&role=${role}`),
    get: (id: string) =>
      request<{ payment: any }>(`/api/payments/${id}`),
    create: (data: { bookingId: string; paymentMethod: string; userId?: string }) =>
      request<{ payment: any }>('/api/payments', { method: 'POST', body: JSON.stringify(data) }),
    complete: (id: string) =>
      request<{ payment: any }>(`/api/payments/${id}`, { method: 'POST' }),
    createOrder: (bookingId: string, amount: number) =>
      request<{ orderId: string; amount: number; currency: string; key: string; bookingId: string; name: string; description: string }>('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ bookingId, amount }),
      }),
    verify: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; bookingId: string }) =>
      request<{ success: boolean; message: string }>('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  verifyAadhar: (imageBase64: string) =>
    request<{ verified: boolean; aadharNumber?: string; name?: string; dob?: string; gender?: string; address?: string; error?: string }>('/api/verify-aadhar', { method: 'POST', body: JSON.stringify({ image: imageBase64 }) }),
};
