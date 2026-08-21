# DocuFlow AI Enterprise Suite

A modern, full-fledged AI-powered office suite with lossless document editing, universal conversion, Microsoft Office compatibility, Google Gemini AI integration, Google OAuth authentication, and Google Drive cloud sync.

## Project Structure
```
DocuFlow-AI/
├── frontend/    # React 18 + Vite + Tailwind CSS + TypeScript Client Application
└── backend/     # Node.js + Express + TypeScript + MongoDB API Service
```

## Features
- **MS Word Document Editor**: Full-featured rich text editing, table insertion, font & paragraph formatting, and lossless `.docx` import/export.
- **Spreadsheet Workspace (Excel)**: Real-time formula evaluator, statistical analysis, on-demand charts (Bar, Line), and `.xlsx`/`.csv` import/export.
- **Presentation Builder (PowerPoint)**: Dynamic slide builder, layout selection, presenter notes, presentation mode, and `.pptx` import/export.
- **Universal Lossless Document Engine**: Convert between Word, Excel, PowerPoint, PDF, Images, and Text without formatting loss.
- **Google Gemini AI Studio**:
  - AI Document Wizard (prompt-to-document synthesis)
  - AI Writer & Language Translator (Tamil, Hindi, French, German, English)
  - Document QA Copilot (PDF Q&A with page citations)
  - AI Presentation Deck Generator
  - AI Spreadsheet Analyst
- **Authentication & Cloud Storage**:
  - 1-Click Passwordless Google OAuth sign-in
  - Google Drive / Gmail Cloud Sync & Local device 1-click downloads
  - 3D Secure 256-bit SSL Subscription Checkout (Card, UPI, NetBanking, QR Code)

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
