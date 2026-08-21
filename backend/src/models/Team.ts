import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export enum TeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export interface ITeamMember {
  userId: mongoose.Types.ObjectId;
  role: TeamRole;
  joinedAt: Date;
}

export interface ITeam extends MongooseDocument {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  planId: string;
  logo?: string;
  storageLimit: number;
  storageUsed: number;
  members: ITeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: String, default: 'business' },
    logo: { type: String, default: '' },
    storageLimit: { type: Number, default: 50 * 1024 * 1024 * 1024 }, // 50GB
    storageUsed: { type: Number, default: 0 },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: Object.values(TeamRole), default: TeamRole.MEMBER },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

TeamSchema.index({ 'members.userId': 1 });

export const Team = mongoose.model<ITeam>('Team', TeamSchema);
