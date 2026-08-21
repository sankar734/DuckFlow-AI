import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { User, UserRole } from '../models/User';
import { Plan } from '../models/Plan';
import { Template } from '../models/Template';
import { DocumentModel, DocumentType } from '../models/Document';
import { logger } from '../utils/logger';

async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding...');

    // 1. Seed Plans
    await Plan.deleteMany({});
    const plans = await Plan.insertMany([
      {
        name: 'FREE',
        slug: 'free',
        priceMonthly: 0,
        priceYearly: 0,
        storageLimit: 5 * 1024 * 1024 * 1024, // 5GB
        aiCreditsMonthly: 50,
        conversionLimitDaily: 5,
        features: [
          'Basic Document & Spreadsheet Editor',
          '50 AI Credits / Month',
          '5GB Cloud Storage',
          '5 Daily File Conversions',
          'Standard PDF Tools',
        ],
        isActive: true,
      },
      {
        name: 'PRO',
        slug: 'pro',
        priceMonthly: 799,
        priceYearly: 7990,
        storageLimit: 50 * 1024 * 1024 * 1024, // 50GB
        aiCreditsMonthly: 500,
        conversionLimitDaily: 100,
        isPopular: true,
        features: [
          'All Free Features + Unlimited Edits',
          '500 AI Credits / Month',
          '50GB High-Speed Cloud Storage',
          '100 Daily Universal Conversions',
          'Full AI Studio (PDF QA, Excel Analyst, PPT Maker)',
          'High-Accuracy Mobile OCR Scanner',
          'Priority 24/7 Support',
        ],
        isActive: true,
      },
      {
        name: 'BUSINESS',
        slug: 'business',
        priceMonthly: 1999,
        priceYearly: 19990,
        storageLimit: 250 * 1024 * 1024 * 1024, // 250GB
        aiCreditsMonthly: 2500,
        conversionLimitDaily: 500,
        features: [
          'Everything in Pro + Unlimited Team Workspaces',
          '2,500 AI Credits / Month',
          '250GB Enterprise Cloud Storage',
          'Unlimited Conversions & Bulk Export',
          'Team Realtime Collaboration & Granular Roles',
          'Admin Analytics & Usage Audit Logs',
          'Custom Branding & SLA Guarantee',
        ],
        isActive: true,
      },
    ]);
    logger.info(`Seeded ${plans.length} Plans`);

    // 2. Seed Admin and Demo Users
    await User.deleteMany({});
    const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
    const demoPasswordHash = await bcrypt.hash('Demo@123456', 10);

    const admin = await User.create({
      name: 'DocuFlow Admin',
      email: 'admin@docuflow.ai',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      planId: 'business',
      storageLimit: 250 * 1024 * 1024 * 1024,
      aiCredits: 2500,
      emailVerified: true,
    });

    const demoUser = await User.create({
      name: 'Sankar Demo',
      email: 'sankar@docuflow.ai',
      passwordHash: demoPasswordHash,
      role: UserRole.USER,
      planId: 'pro',
      storageLimit: 50 * 1024 * 1024 * 1024,
      aiCredits: 500,
      emailVerified: true,
    });

    logger.info(`Seeded Admin (${admin.email}) and Demo User (${demoUser.email})`);

    // 3. Seed Templates
    await Template.deleteMany({});
    const templates = await Template.insertMany([
      {
        title: 'Modern Executive Resume',
        category: 'Resume',
        type: DocumentType.WORD,
        description: 'Clean modern resume template with skills, experience, and contact sidebar.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80',
        isPremium: false,
        usageCount: 1420,
        content: {
          title: 'Executive Resume',
          body: '<h2>[Your Name]</h2><p><strong>Senior Software Engineer & Architect</strong></p><hr><p>Proven leader with expertise in high-scale web systems and cloud applications.</p>',
        },
      },
      {
        title: 'Q3 Financial Budget & Projection',
        category: 'Business',
        type: DocumentType.EXCEL,
        description: 'Quarterly financial forecast spreadsheet with auto-calculating totals and formula rows.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
        isPremium: true,
        usageCount: 890,
        content: {
          sheets: [
            {
              id: 's1',
              name: 'Budget Forecast',
              grid: [
                ['Department', 'Q1 Actual', 'Q2 Actual', 'Q3 Target', 'Total YTD'],
                ['Engineering', 45000, 52000, 58000, '=SUM(B2:D2)'],
                ['Marketing', 18000, 22000, 26000, '=SUM(B3:D3)'],
                ['Operations', 12000, 13500, 14000, '=SUM(B4:D4)'],
                ['Grand Total', '=SUM(B2:B4)', '=SUM(C2:C4)', '=SUM(D2:D4)', '=SUM(E2:E4)'],
              ],
            },
          ],
        },
      },
      {
        title: 'AI Product Pitch Deck',
        category: 'Presentation',
        type: DocumentType.PPT,
        description: 'Vibrant 8-slide presentation deck designed for startup product launches.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&q=80',
        isPremium: true,
        usageCount: 2150,
        content: {
          theme: 'Midnight Gradient',
          slides: [
            { id: '1', layout: 'title', title: 'DocuFlow AI', subtitle: 'The Next Generation Intelligent Workspace', notes: 'Welcome investors.' },
            { id: '2', layout: 'bullets', title: 'The Problem', bullets: ['Fragmented tools (Word, Excel, PDF tools disjointed)', 'Manual conversions lose fidelity', 'AI tools lack deep document context'], notes: 'Paint user pain.' },
            { id: '3', layout: 'bullets', title: 'Our Solution', bullets: ['One unified workspace for Docs, Sheets, Slides, and PDFs', 'Integrated AI Copilot across every editor', 'Universal conversion in 1-click'], notes: 'Highlight differentiators.' },
          ],
        },
      },
      {
        title: 'Invoice & Service Statement',
        category: 'Invoice',
        type: DocumentType.WORD,
        description: 'Professional billing statement format with line-item table and tax summary.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80',
        isPremium: false,
        usageCount: 1670,
        content: {
          title: 'Invoice - DocuFlow Services',
          body: '<h2>INVOICE</h2><p>Invoice #: INV-2026-001<br>Date: August 16, 2026</p><hr><p>Service: Cloud Platform Subscription ($29.00)</p>',
        },
      },
    ]);
    logger.info(`Seeded ${templates.length} Templates`);

    // 4. Seed Initial Sample Documents for Demo User
    await DocumentModel.deleteMany({});
    await DocumentModel.create([
      {
        ownerId: demoUser._id,
        name: 'Product Roadmap 2026.docx',
        type: DocumentType.WORD,
        size: 1024 * 45,
        currentVersionNumber: 2,
        isFavorite: true,
        content: {
          title: 'DocuFlow Product Roadmap 2026',
          body: '<h2>DocuFlow AI Strategic Roadmap</h2><p>This roadmap details the planned release milestones for Q3 and Q4 2026.</p><h3>Key Priorities</h3><ul><li>Real-time collaborative editing with Socket.IO</li><li>Mobile document scanner with auto-edge detection</li><li>Universal PDF toolsuite with OCR</li></ul>',
        },
      },
      {
        ownerId: demoUser._id,
        name: 'Q3 Financial Projections.xlsx',
        type: DocumentType.EXCEL,
        size: 1024 * 85,
        currentVersionNumber: 1,
        isFavorite: true,
        content: {
          sheets: [
            {
              id: 's1',
              name: 'Revenue & Costs',
              grid: [
                ['Month', 'New Customers', 'MRR ($)', 'Server Cost ($)', 'Net Profit ($)'],
                ['January', 450, 14200, 1850, '=C2-D2'],
                ['February', 620, 18900, 2100, '=C3-D3'],
                ['March', 890, 24500, 2450, '=C4-D4'],
                ['Total Q1', '=SUM(B2:B4)', '=SUM(C2:C4)', '=SUM(D2:D4)', '=SUM(E2:E4)'],
              ],
            },
          ],
        },
      },
      {
        ownerId: demoUser._id,
        name: 'Investor Pitch Deck.pptx',
        type: DocumentType.PPT,
        size: 1024 * 320,
        currentVersionNumber: 1,
        isFavorite: false,
        content: {
          theme: 'Modern Indigo',
          slides: [
            { id: '1', layout: 'title', title: 'DocuFlow AI Platform', subtitle: 'Seed Series Pitch', notes: 'Introduce the vision.' },
            { id: '2', layout: 'bullets', title: 'Growth Highlights', bullets: ['120,000+ monthly active users', '3.8M documents processed', '98.5% conversion success rate'], notes: 'Highlight traction.' },
          ],
        },
      },
    ]);
    logger.info('Seeded Sample Documents for Demo User');

    logger.info('Database Seeding Complete!');
    process.exit(0);
  } catch (error) {
    logger.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
