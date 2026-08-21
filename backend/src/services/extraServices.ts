import mongoose from 'mongoose';
import { Template } from '../models/Template';
import { DocumentPermission, PermissionRole } from '../models/DocumentPermission';
import { Comment } from '../models/Comment';
import { Notification, NotificationType } from '../models/Notification';
import { Team, TeamRole } from '../models/Team';
import { AppError } from '../middleware/errorHandler';
import crypto from 'crypto';

export class TemplateService {
  async getTemplates(category?: string, search?: string) {
    const query: any = {};
    if (category && category !== 'All') query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };
    return Template.find(query).sort({ usageCount: -1 });
  }

  async getTemplateById(id: string) {
    const template = await Template.findById(id);
    if (!template) throw new AppError('Template not found', 404);
    template.usageCount += 1;
    await template.save();
    return template;
  }
}

export class SharingService {
  async shareDocument(documentId: string, data: {
    email?: string;
    role: PermissionRole;
    isPublicLink?: boolean;
    expiresInDays?: number;
  }) {
    const shareToken = crypto.randomBytes(16).toString('hex');
    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const permission = await DocumentPermission.create({
      documentId: new mongoose.Types.ObjectId(documentId),
      userEmail: data.email?.toLowerCase(),
      role: data.role,
      shareToken,
      isPublicLink: !!data.isPublicLink,
      expiresAt,
    });

    return {
      permission,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${shareToken}`,
    };
  }

  async getShares(documentId: string) {
    return DocumentPermission.find({ documentId: new mongoose.Types.ObjectId(documentId) });
  }

  async removeShare(permissionId: string) {
    return DocumentPermission.findByIdAndDelete(permissionId);
  }
}

export class CommentService {
  async getComments(documentId: string) {
    return Comment.find({ documentId: new mongoose.Types.ObjectId(documentId) })
      .populate('userId', 'name email profileImage')
      .sort({ createdAt: 1 });
  }

  async addComment(userId: string, documentId: string, content: string, position?: any) {
    return Comment.create({
      documentId: new mongoose.Types.ObjectId(documentId),
      userId: new mongoose.Types.ObjectId(userId),
      content,
      position,
    });
  }

  async resolveComment(commentId: string, userId: string) {
    return Comment.findByIdAndUpdate(
      commentId,
      { resolved: true, resolvedBy: new mongoose.Types.ObjectId(userId), resolvedAt: new Date() },
      { new: true }
    );
  }
}

export class NotificationService {
  async getUserNotifications(userId: string) {
    return Notification.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(30);
  }

  async markAsRead(notificationId: string) {
    return Notification.findByIdAndUpdate(notificationId, { read: true, readAt: new Date() }, { new: true });
  }

  async markAllAsRead(userId: string) {
    return Notification.updateMany({ userId: new mongoose.Types.ObjectId(userId), read: false }, { read: true, readAt: new Date() });
  }
}

export class TeamService {
  async getUserTeams(userId: string) {
    return Team.find({ 'members.userId': new mongoose.Types.ObjectId(userId) });
  }

  async createTeam(userId: string, name: string) {
    return Team.create({
      name,
      ownerId: new mongoose.Types.ObjectId(userId),
      members: [
        {
          userId: new mongoose.Types.ObjectId(userId),
          role: TeamRole.OWNER,
          joinedAt: new Date(),
        },
      ],
    });
  }
}

export const templateService = new TemplateService();
export const sharingService = new SharingService();
export const commentService = new CommentService();
export const notificationService = new NotificationService();
export const teamService = new TeamService();
