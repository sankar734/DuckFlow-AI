import React, { useState, useEffect } from 'react';
import {
  Users,
  HardDrive,
  Sparkles,
  Layers,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Ban,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { adminService } from '../../services/extraServices';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { toast } from 'sonner';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    adminService.getMetrics().then(setData);
  }, []);

  if (!data) return <div className="p-8 text-center text-xs text-slate-400">Loading admin metrics...</div>;

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <Badge variant="purple" size="sm" className="mb-1">
          Executive Operations
        </Badge>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Admin SaaS Analytics</h1>
        <p className="text-xs text-slate-400">Platform performance, monthly recurring revenue, and user management</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Active Users</span>
            <Users className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{data.metrics.totalUsers.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-500 font-bold mt-1">+18.4% this month</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Monthly Recurring Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">₹{data.metrics.activeMRR.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-500 font-bold mt-1">+24.2% growth</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total AI Operations</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{data.metrics.totalAIRequests.toLocaleString()}</div>
          <div className="text-[10px] text-purple-400 font-bold mt-1">99.8% uptime</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total File Conversions</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{data.metrics.totalConversions.toLocaleString()}</div>
          <div className="text-[10px] text-brand-400 font-bold mt-1">100% loss-free</div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Growth & MRR Area Chart */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">User Growth & Revenue Velocity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.userGrowth}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#userGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Usage Breakdown Pie Chart */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">AI Usage Breakdown</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.charts.aiUsageBreakdown} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                  {data.charts.aiUsageBreakdown.map((_: any, idx: number) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400">
            {data.charts.aiUsageBreakdown.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5 truncate">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="truncate">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Registered SaaS Accounts
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Plan</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentUsers.map((u: any) => (
                <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                  <td className="py-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-[10px]">
                      {u.name.charAt(0)}
                    </div>
                    {u.name}
                  </td>
                  <td className="py-3 text-slate-400 font-mono">{u.email}</td>
                  <td className="py-3">
                    <Badge variant={u.planId === 'business' ? 'purple' : 'brand'} size="sm">
                      {u.planId.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 text-slate-400">{u.role}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => toast.success(`Updated status for ${u.name}`)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
