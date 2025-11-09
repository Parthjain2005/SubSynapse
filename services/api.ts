import type { User, SubscriptionGroup, MySubscription } from '../types.ts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthToken = (): string | null => localStorage.getItem('authToken');

const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setAuthToken(null);
    window.location.href = '/';
    throw new Error('Session expired. Please login again.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }

  return data;
};

export const login = async (email: string, password: string): Promise<{ token: string; user: User }> => {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  setAuthToken(data.token);

  const user: User = {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    creditBalance: data.user.creditBalance,
    avatarUrl: data.user.avatarUrl || `https://api.dicebear.com/8.x/adventurer/svg?seed=${data.user.name}`,
    memberSince: new Date(data.user.memberSince).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  };

  return { token: data.token, user };
};

export const register = async (name: string, email: string, password: string): Promise<{ token: string; user: User }> => {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });

  setAuthToken(data.token);

  const user: User = {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    creditBalance: data.user.creditBalance,
    avatarUrl: data.user.avatarUrl || `https://api.dicebear.com/8.x/adventurer/svg?seed=${name}`,
    memberSince: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  };

  return { token: data.token, user };
};

export const logout = () => {
  setAuthToken(null);
};

export const fetchAuthenticatedUser = async (): Promise<User | null> => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const data = await apiRequest('/users/me');
    return {
      id: data.user._id,
      name: data.user.name,
      email: data.user.email,
      creditBalance: data.user.creditBalance,
      avatarUrl: data.user.avatarUrl || `https://api.dicebear.com/8.x/adventurer/svg?seed=${data.user.name}`,
      memberSince: new Date(data.user.memberSince).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    };
  } catch (error) {
    return null;
  }
};

export const fetchGroups = async (): Promise<SubscriptionGroup[]> => {
  const data = await apiRequest('/groups?status=active');
  return data.groups.map((group: any) => ({
    id: group._id,
    name: group.name,
    icon: group.icon,
    totalPrice: group.totalPrice,
    slotsTotal: group.slotsTotal,
    slotsFilled: group.slotsFilled,
    category: group.category,
    tags: group.tags,
    status: group.status,
    postedBy: group.postedBy,
    proof: group.proof,
  }));
};

export const fetchMySubscriptions = async (): Promise<MySubscription[]> => {
  const data = await apiRequest('/users/subscriptions');
  return data.subscriptions.map((sub: any) => ({
    id: sub.groupId,
    name: sub.name,
    icon: sub.icon,
    myShare: sub.myShare,
    membershipType: sub.membershipType,
    nextPaymentDate: sub.nextPaymentDate,
    endDate: sub.endDate,
    status: sub.status,
    credentials: sub.credentials,
  }));
};

export const joinGroup = async (subscription: MySubscription, cost: number): Promise<void> => {
  await apiRequest('/memberships/join', {
    method: 'POST',
    body: JSON.stringify({
      groupId: subscription.id,
      membershipType: subscription.membershipType,
      days: subscription.endDate ? Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : undefined,
    }),
  });
};

export const leaveGroup = async (subscriptionId: string, refund: number): Promise<void> => {
  await apiRequest('/memberships/leave', {
    method: 'POST',
    body: JSON.stringify({ membershipId: subscriptionId }),
  });
};

export const addCredits = async (amount: number): Promise<void> => {
  throw new Error('Please use Razorpay payment flow');
};

export const createRazorpayOrder = async (amount: number): Promise<{ orderId: string; amount: number; currency: string; keyId: string }> => {
  const data = await apiRequest('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  return data;
};

export const verifyRazorpayPayment = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<{ newBalance: number; amountAdded: number }> => {
  const data = await apiRequest('/payments/verify-payment', {
    method: 'POST',
    body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature }),
  });
  return data;
};

export const createGroup = async (groupData: Omit<SubscriptionGroup, 'id' | 'postedBy' | 'slotsFilled'>): Promise<SubscriptionGroup> => {
  const data = await apiRequest('/groups', {
    method: 'POST',
    body: JSON.stringify(groupData),
  });

  return {
    id: data.group._id,
    name: data.group.name,
    icon: data.group.icon,
    totalPrice: data.group.totalPrice,
    slotsTotal: data.group.slotsTotal,
    slotsFilled: data.group.slotsFilled,
    category: data.group.category,
    tags: data.group.tags,
    status: data.group.status,
    postedBy: data.group.postedBy,
    proof: data.group.proof,
  };
};

export const requestWithdrawal = async (amount: number, upiId: string): Promise<void> => {
  await apiRequest('/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify({ amount, upiId }),
  });
};

export const forgotPassword = async (email: string): Promise<void> => {
  console.log(`Password reset link sent to ${email}`);
};

export const changePassword = async (oldPass: string, newPass: string): Promise<void> => {
  await apiRequest('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword: oldPass, newPassword: newPass }),
  });
};

export const updateProfilePicture = async (imageDataUrl: string): Promise<void> => {
  await apiRequest('/users/profile', {
    method: 'PUT',
    body: JSON.stringify({ avatarUrl: imageDataUrl }),
  });
};
