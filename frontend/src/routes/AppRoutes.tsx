import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LandingPage } from '../pages/public/LandingPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { OTPVerificationPage } from '../pages/auth/OTPVerificationPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardHomePage } from '../pages/dashboard/DashboardHomePage';
import { MyDocumentsPage } from '../pages/documents/MyDocumentsPage';
import {
  RecentDocumentsPage,
  SharedWithMePage,
  TrashPage,
} from '../pages/documents/RecentAndTrashPages';
import { WordPage, ExcelPage, PowerPointPage } from '../pages/editors/EditorPages';
import { PDFToolsPage } from '../pages/pdf/PDFToolsPage';
import { ConverterPage } from '../pages/converter/ConverterPage';
import { ScannerPage } from '../pages/scanner/ScannerPage';
import { AIStudioPage } from '../pages/ai/AIStudioPage';
import { TemplatesPage } from '../pages/templates/TemplatesPage';
import { BillingPage } from '../pages/billing/BillingPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<OTPVerificationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Main Authenticated SaaS Workspace Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardHomePage />} />
        <Route path="/documents" element={<MyDocumentsPage />} />
        <Route path="/recent" element={<RecentDocumentsPage />} />
        <Route path="/shared" element={<SharedWithMePage />} />
        <Route path="/trash" element={<TrashPage />} />

        {/* Studio Editors */}
        <Route path="/word" element={<WordPage />} />
        <Route path="/word/:id" element={<WordPage />} />
        <Route path="/excel" element={<ExcelPage />} />
        <Route path="/excel/:id" element={<ExcelPage />} />
        <Route path="/powerpoint" element={<PowerPointPage />} />
        <Route path="/powerpoint/:id" element={<PowerPointPage />} />

        {/* PDF, Converter & Scanner */}
        <Route path="/pdf" element={<PDFToolsPage />} />
        <Route path="/pdf-tools" element={<PDFToolsPage />} />
        <Route path="/conversions" element={<ConverterPage />} />
        <Route path="/scanner" element={<ScannerPage />} />

        {/* AI Studio & Templates */}
        <Route path="/ai" element={<AIStudioPage />} />
        <Route path="/ai/*" element={<AIStudioPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/templates/:id" element={<TemplatesPage />} />

        {/* Account & Billing */}
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Admin Console */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
