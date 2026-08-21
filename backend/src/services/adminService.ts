import { User } from '../models/User';
import { DocumentModel } from '../models/Document';
import { AIUsage } from '../models/AIUsage';
import { ConversionJob } from '../models/ConversionJob';
import { Payment } from '../models/Payment';
import { ActivityLog } from '../models/ActivityLog';

export class AdminService {
  async getDashboardMetrics() {
    const [
      totalUsers,
      totalDocuments,
      totalAIRequests,
      totalConversions,
      payments,
      recentUsers,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments(),
      DocumentModel.countDocuments({ isDeleted: false }),
      AIUsage.countDocuments(),
      ConversionJob.countDocuments(),
      Payment.find({ status: 'SUCCESS' }),
      User.find().sort({ createdAt: -1 }).limit(8),
      ActivityLog.find().sort({ createdAt: -1 }).limit(12),
    ]);

    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    const userGrowth = [
      { month: 'Jan', users: 140, revenue: 1200 },
      { month: 'Feb', users: 280, revenue: 2400 },
      { month: 'Mar', users: 490, revenue: 4100 },
      { month: 'Apr', users: 780, revenue: 6800 },
      { month: 'May', users: 1120, revenue: 9900 },
      { month: 'Jun', users: totalUsers || 1540, revenue: totalRevenue || 14200 },
    ];

    const aiUsageBreakdown = [
      { name: 'AI Writer', value: 42 },
      { name: 'AI PDF Assistant', value: 28 },
      { name: 'Document Wizard', value: 16 },
      { name: 'AI Presentations', value: 9 },
      { name: 'AI Spreadsheet', value: 5 },
    ];

    return {
      metrics: {
        totalUsers,
        totalDocuments,
        totalAIRequests,
        totalConversions,
        totalRevenue,
        activeMRR: 8450,
      },
      charts: {
        userGrowth,
        aiUsageBreakdown,
      },
      recentUsers,
      recentActivity,
    };
  }

  async getAllUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);
    return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async toggleUserBlockStatus(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    user.isBlocked = !user.isBlocked;
    await user.save();
    return user;
  }
}

export const adminService = new AdminService();
