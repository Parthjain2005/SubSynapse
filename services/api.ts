import type { User, SubscriptionGroup, MySubscription } from '../types.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const getAuthToken = (): string | null => localStorage.getItem('authToken');

const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

export const login = async (email: string, password: string): Promise<{ token: string; user: User }> => {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (userError || !userData) {
    throw new Error('Invalid credentials');
  }

  const token = `mock-token-${userData.id}`;
  setAuthToken(token);

  const user: User = {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    creditBalance: userData.credit_balance,
    avatarUrl: userData.avatar_url || `https://api.dicebear.com/8.x/adventurer/svg?seed=${userData.name}`,
    memberSince: new Date(userData.member_since).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  };

  return { token, user };
};

export const register = async (name: string, email: string, password: string): Promise<{ token: string; user: User }> => {
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    throw new Error('Email already registered');
  }

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      email,
      name,
      credit_balance: 1000,
      role: 'user',
      avatar_url: `https://api.dicebear.com/8.x/adventurer/svg?seed=${name}`,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const token = `mock-token-${newUser.id}`;
  setAuthToken(token);

  const user: User = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    creditBalance: newUser.credit_balance,
    avatarUrl: newUser.avatar_url,
    memberSince: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  };

  return { token, user };
};

export const logout = () => {
  setAuthToken(null);
};

const getUserIdFromToken = (token: string): string | null => {
  const match = token.match(/mock-token-(.*)/);
  return match ? match[1] : null;
};

export const fetchAuthenticatedUser = async (): Promise<User | null> => {
  const token = getAuthToken();
  if (!token) return null;

  const userId = getUserIdFromToken(token);
  if (!userId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    creditBalance: data.credit_balance,
    avatarUrl: data.avatar_url || `https://api.dicebear.com/8.x/adventurer/svg?seed=${data.name}`,
    memberSince: new Date(data.member_since).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  };
};

export const fetchGroups = async (): Promise<SubscriptionGroup[]> => {
  const { data, error } = await supabase
    .from('subscription_groups')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data.map((group: any) => ({
    id: group.id,
    name: group.name,
    icon: group.icon,
    totalPrice: parseFloat(group.total_price),
    slotsTotal: group.slots_total,
    slotsFilled: group.slots_filled,
    category: group.category,
    tags: group.tags,
    status: group.status,
    postedBy: {
      name: group.posted_by_name,
      rating: parseFloat(group.posted_by_rating),
    },
    proof: group.proof,
  }));
};

export const fetchMySubscriptions = async (): Promise<MySubscription[]> => {
  const user = await fetchAuthenticatedUser();
  if (!user) return [];

  const { data: memberships, error } = await supabase
    .from('memberships')
    .select(`
      *,
      subscription_groups (*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (error) throw new Error(error.message);

  return memberships.map((membership: any) => {
    const group = membership.subscription_groups;
    return {
      id: group.id,
      name: group.name,
      icon: group.icon,
      myShare: parseFloat(membership.my_share),
      membershipType: membership.membership_type,
      nextPaymentDate: membership.next_payment_date,
      endDate: membership.end_date,
      status: membership.status,
      credentials: {
        username: group.credentials_username,
        password: group.credentials_password,
      },
    };
  });
};

export const joinGroup = async (subscription: MySubscription, cost: number): Promise<void> => {
  const user = await fetchAuthenticatedUser();
  if (!user) throw new Error('Not authenticated');

  const { data: userData } = await supabase
    .from('users')
    .select('credit_balance')
    .eq('id', user.id)
    .single();

  if (!userData || userData.credit_balance < cost) {
    throw new Error('Insufficient funds');
  }

  const { data: group } = await supabase
    .from('subscription_groups')
    .select('*')
    .eq('id', subscription.id)
    .single();

  if (!group || group.slots_filled >= group.slots_total) {
    throw new Error('No available slots');
  }

  await supabase
    .from('users')
    .update({ credit_balance: userData.credit_balance - cost })
    .eq('id', user.id);

  await supabase
    .from('subscription_groups')
    .update({
      slots_filled: group.slots_filled + 1,
      status: group.slots_filled + 1 >= group.slots_total ? 'full' : group.status
    })
    .eq('id', subscription.id);

  const endDate = subscription.endDate ? new Date(subscription.endDate) : undefined;
  const nextPaymentDate = subscription.membershipType === 'monthly'
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  await supabase
    .from('memberships')
    .insert({
      user_id: user.id,
      group_id: subscription.id,
      membership_type: subscription.membershipType,
      my_share: cost,
      next_payment_date: nextPaymentDate,
      end_date: endDate?.toISOString(),
      status: 'active',
    });

  await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      type: 'subscription_payment',
      amount: -cost,
      description: `Joined ${group.name} - ${subscription.membershipType} membership`,
      status: 'completed',
    });
};

export const leaveGroup = async (subscriptionId: string, refund: number): Promise<void> => {
  const user = await fetchAuthenticatedUser();
  if (!user) throw new Error('Not authenticated');

  const { data: membership } = await supabase
    .from('memberships')
    .select('*, subscription_groups(*)')
    .eq('group_id', subscriptionId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!membership) throw new Error('Membership not found');

  const { data: userData } = await supabase
    .from('users')
    .select('credit_balance')
    .eq('id', user.id)
    .single();

  if (refund > 0) {
    await supabase
      .from('users')
      .update({ credit_balance: userData!.credit_balance + refund })
      .eq('id', user.id);

    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'refund',
        amount: refund,
        description: `Refund for leaving ${membership.subscription_groups.name}`,
        status: 'completed',
      });
  }

  await supabase
    .from('memberships')
    .update({ status: 'cancelled' })
    .eq('id', membership.id);

  const group = membership.subscription_groups;
  await supabase
    .from('subscription_groups')
    .update({
      slots_filled: Math.max(0, group.slots_filled - 1),
      status: group.status === 'full' ? 'active' : group.status
    })
    .eq('id', subscriptionId);
};

export const addCredits = async (amount: number): Promise<void> => {
  const user = await fetchAuthenticatedUser();
  if (!user) throw new Error('Not authenticated');

  const { data: userData } = await supabase
    .from('users')
    .select('credit_balance')
    .eq('id', user.id)
    .single();

  await supabase
    .from('users')
    .update({ credit_balance: userData!.credit_balance + amount })
    .eq('id', user.id);

  await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      type: 'credit_add',
      amount: amount,
      description: `Added ${amount} credits via payment`,
      status: 'completed',
    });
};

export const createRazorpayOrder = async (amount: number): Promise<{ orderId: string; amount: number; currency: string; keyId: string }> => {
  throw new Error('Razorpay integration requires backend server');
};

export const verifyRazorpayPayment = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<{ newBalance: number; amountAdded: number }> => {
  throw new Error('Razorpay integration requires backend server');
};

export const createGroup = async (groupData: Omit<SubscriptionGroup, 'id' | 'postedBy' | 'slotsFilled'>): Promise<SubscriptionGroup> => {
  const user = await fetchAuthenticatedUser();
  if (!user) throw new Error('Not authenticated');

  const { data: newGroup, error } = await supabase
    .from('subscription_groups')
    .insert({
      name: groupData.name,
      icon: groupData.icon,
      total_price: groupData.totalPrice,
      slots_total: groupData.slotsTotal,
      slots_filled: 0,
      category: groupData.category,
      tags: groupData.tags,
      status: 'pending_review',
      credentials_username: groupData.credentials?.username || '',
      credentials_password: groupData.credentials?.password || '',
      proof: groupData.proof || '',
      owner_id: user.id,
      posted_by_name: user.name,
      posted_by_rating: 5.0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: newGroup.id,
    name: newGroup.name,
    icon: newGroup.icon,
    totalPrice: parseFloat(newGroup.total_price),
    slotsTotal: newGroup.slots_total,
    slotsFilled: newGroup.slots_filled,
    category: newGroup.category,
    tags: newGroup.tags,
    status: newGroup.status,
    postedBy: {
      name: newGroup.posted_by_name,
      rating: parseFloat(newGroup.posted_by_rating),
    },
    proof: newGroup.proof,
  };
};

export const requestWithdrawal = async (amount: number, upiId: string): Promise<void> => {
  const user = await fetchAuthenticatedUser();
  if (!user) throw new Error('Not authenticated');

  if (amount < 500) {
    throw new Error('Minimum withdrawal amount is 500 credits');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('credit_balance')
    .eq('id', user.id)
    .single();

  if (!userData || userData.credit_balance < amount) {
    throw new Error('Insufficient balance');
  }

  const { data: pendingRequest } = await supabase
    .from('withdrawal_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (pendingRequest) {
    throw new Error('You already have a pending withdrawal request');
  }

  const { error } = await supabase
    .from('withdrawal_requests')
    .insert({
      user_id: user.id,
      amount: amount,
      upi_id: upiId,
      status: 'pending',
    });

  if (error) throw new Error(error.message);
};

export const forgotPassword = async (email: string): Promise<void> => {
  console.log(`Password reset link sent to ${email}`);
};

export const changePassword = async (oldPass: string, newPass: string): Promise<void> => {
  console.log('Password changed successfully');
};

export const updateProfilePicture = async (imageDataUrl: string): Promise<void> => {
  const user = await fetchAuthenticatedUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('users')
    .update({ avatar_url: imageDataUrl })
    .eq('id', user.id);

  if (error) throw new Error(error.message);
};
