import React, { useState, useEffect } from 'react';
import { supabase } from './services/api.ts';
import Header from './components/Header.tsx';
import GlassmorphicCard from './components/GlassmorphicCard.tsx';

interface DashboardStats {
  totalUsers: number;
  activeGroups: number;
  pendingApprovals: number;
  pendingWithdrawals: number;
  totalRevenue: number;
}

interface PendingGroup {
  id: string;
  name: string;
  category: string;
  owner_name: string;
  created_at: string;
}

interface WithdrawalRequest {
  id: string;
  user_name: string;
  amount: number;
  upi_id: string;
  requested_at: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeGroups: 0,
    pendingApprovals: 0,
    pendingWithdrawals: 0,
    totalRevenue: 0,
  });
  const [pendingGroups, setPendingGroups] = useState<PendingGroup[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const { data: usersData } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });

      const { data: groupsData } = await supabase
        .from('subscription_groups')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      const { data: pendingGroupsData } = await supabase
        .from('subscription_groups')
        .select('id, name, category, owner_id, created_at, users!subscription_groups_owner_id_fkey(name)')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: withdrawalsData } = await supabase
        .from('withdrawal_requests')
        .select('id, amount, upi_id, requested_at, users!withdrawal_requests_user_id_fkey(name)')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })
        .limit(5);

      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'credit_add')
        .eq('status', 'completed');

      const totalRevenue = transactionsData?.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;

      setStats({
        totalUsers: (usersData as any)?.count || 0,
        activeGroups: (groupsData as any)?.count || 0,
        pendingApprovals: pendingGroupsData?.length || 0,
        pendingWithdrawals: withdrawalsData?.length || 0,
        totalRevenue: Math.round(totalRevenue),
      });

      setPendingGroups(pendingGroupsData?.map((g: any) => ({
        id: g.id,
        name: g.name,
        category: g.category,
        owner_name: g.users?.name || 'Unknown',
        created_at: g.created_at,
      })) || []);

      setWithdrawalRequests(withdrawalsData?.map((w: any) => ({
        id: w.id,
        user_name: w.users?.name || 'Unknown',
        amount: parseFloat(w.amount.toString()),
        upi_id: w.upi_id,
        requested_at: w.requested_at,
      })) || []);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const approveGroup = async (groupId: string) => {
    try {
      await supabase
        .from('subscription_groups')
        .update({ status: 'active' })
        .eq('id', groupId);

      alert('Group approved successfully!');
      loadDashboardData();
    } catch (error: any) {
      alert('Failed to approve group: ' + error.message);
    }
  };

  const rejectGroup = async (groupId: string) => {
    try {
      await supabase
        .from('subscription_groups')
        .update({ status: 'rejected' })
        .eq('id', groupId);

      alert('Group rejected');
      loadDashboardData();
    } catch (error: any) {
      alert('Failed to reject group: ' + error.message);
    }
  };

  const processWithdrawal = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const { data: request } = await supabase
        .from('withdrawal_requests')
        .select('*, users!withdrawal_requests_user_id_fkey(credit_balance)')
        .eq('id', requestId)
        .single();

      if (!request) throw new Error('Request not found');

      if (action === 'approve') {
        const user = request.users as any;
        if (user.credit_balance < request.amount) {
          throw new Error('User has insufficient balance');
        }

        await supabase
          .from('users')
          .update({ credit_balance: user.credit_balance - request.amount })
          .eq('id', request.user_id);

        await supabase
          .from('transactions')
          .insert({
            user_id: request.user_id,
            type: 'withdrawal',
            amount: -request.amount,
            description: `Withdrawal to UPI: ${request.upi_id}`,
            status: 'completed',
          });
      }

      await supabase
        .from('withdrawal_requests')
        .update({ status: action === 'approve' ? 'approved' : 'rejected', processed_at: new Date().toISOString() })
        .eq('id', requestId);

      alert(`Withdrawal ${action}d successfully!`);
      loadDashboardData();
    } catch (error: any) {
      alert('Failed to process withdrawal: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <GlassmorphicCard className="p-6">
            <div className="text-slate-400 text-sm mb-2">Total Users</div>
            <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
          </GlassmorphicCard>

          <GlassmorphicCard className="p-6">
            <div className="text-slate-400 text-sm mb-2">Active Groups</div>
            <div className="text-3xl font-bold text-white">{stats.activeGroups}</div>
          </GlassmorphicCard>

          <GlassmorphicCard className="p-6">
            <div className="text-slate-400 text-sm mb-2">Pending Approvals</div>
            <div className="text-3xl font-bold text-amber-400">{stats.pendingApprovals}</div>
          </GlassmorphicCard>

          <GlassmorphicCard className="p-6">
            <div className="text-slate-400 text-sm mb-2">Pending Withdrawals</div>
            <div className="text-3xl font-bold text-amber-400">{stats.pendingWithdrawals}</div>
          </GlassmorphicCard>

          <GlassmorphicCard className="p-6">
            <div className="text-slate-400 text-sm mb-2">Total Revenue</div>
            <div className="text-3xl font-bold text-green-400">₹{stats.totalRevenue.toLocaleString()}</div>
          </GlassmorphicCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GlassmorphicCard className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Pending Group Approvals</h2>
            {pendingGroups.length === 0 ? (
              <p className="text-slate-400">No pending approvals</p>
            ) : (
              <div className="space-y-4">
                {pendingGroups.map(group => (
                  <div key={group.id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-white font-semibold">{group.name}</h3>
                        <p className="text-slate-400 text-sm">{group.category}</p>
                        <p className="text-slate-500 text-xs">By: {group.owner_name}</p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(group.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => approveGroup(group.id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectGroup(group.id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassmorphicCard>

          <GlassmorphicCard className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Pending Withdrawals</h2>
            {withdrawalRequests.length === 0 ? (
              <p className="text-slate-400">No pending withdrawals</p>
            ) : (
              <div className="space-y-4">
                {withdrawalRequests.map(request => (
                  <div key={request.id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-white font-semibold">{request.user_name}</h3>
                        <p className="text-green-400 text-lg font-bold">₹{request.amount.toLocaleString()}</p>
                        <p className="text-slate-400 text-sm">UPI: {request.upi_id}</p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(request.requested_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => processWithdrawal(request.id, 'approve')}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => processWithdrawal(request.id, 'reject')}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassmorphicCard>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
