import React, { useState, useRef, useEffect } from 'react';
import {
  Table as TableIcon,
  Plus,
  Trash2,
  BarChart2,
  Sparkles,
  Download,
  Upload,
  Save,
  FileCheck,
  Calculator,
  ArrowDown,
  ArrowRight,
  TrendingUp,
  Filter,
  ArrowUpDown,
  Printer,
  FilePlus,
  CheckCircle2,
  DollarSign,
  Percent,
  Hash,
  Grid as GridIcon,
  Eye,
  Layers,
  HelpCircle,
  MoreVertical,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { exportTableToPDF } from '../../utils/pdfGenerator';
import { parseSpreadsheet } from '../../utils/documentParsers';
import { uploadToGoogleDrive } from '../../utils/googleDriveSync';
import { toast } from 'sonner';

export const ExcelWorkspace: React.FC<{ initialDocName?: string }> = ({
  initialDocName = 'Financial_Model_2026.xlsx',
}) => {
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [docName, setDocName] = useState(initialDocName);
  const [activeRibbonTab, setActiveRibbonTab] = useState<'home' | 'insert' | 'formulas' | 'data' | 'view' | 'ai'>('home');
  const [activeSheet, setActiveSheet] = useState('Revenue Model');
  const [sheets, setSheets] = useState(['Revenue Model', 'Operating Expenses', 'Headcount Summary']);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [formulaValue, setFormulaValue] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [showAIAnalyst, setShowAIAnalyst] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // New Workbook Modal
  const [isNewBookModalOpen, setIsNewBookModalOpen] = useState(false);

  // Grid Data: 10 Rows x 8 Columns
  const defaultHeaders = ['Category', 'Q1 Target', 'Q2 Target', 'Q3 Target', 'Q4 Target', 'Annual Total', 'Growth %', 'Variance'];
  const [headers, setHeaders] = useState(defaultHeaders);
  const [gridData, setGridData] = useState<string[][]>([
    ['Enterprise SaaS', '125000', '168000', '210000', '290000', '793000', '42%', '+12.4%'],
    ['Self-Serve Pro', '45000', '58000', '74000', '98000', '275000', '35%', '+8.2%'],
    ['AI Credit Top-ups', '18000', '29000', '42000', '65000', '154000', '85%', '+24.1%'],
    ['Custom Integration', '30000', '45000', '40000', '60000', '175000', '20%', '-5.0%'],
    ['Total Gross Revenue', '218000', '300000', '366000', '513000', '1397000', '45%', '+10.8%'],
    ['Cost of Goods Sold', '32000', '44000', '52000', '71000', '199000', '18%', '-2.1%'],
    ['Net Gross Margin', '186000', '256000', '314000', '442000', '1198000', '52%', '+14.5%'],
    ['Operating Expenses', '62000', '71000', '84000', '95000', '312000', '22%', '+3.4%'],
  ]);

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('docuflow_active_excel_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.headers && Array.isArray(parsed.headers)) {
          setHeaders(parsed.headers);
        }
        if (parsed.gridData && Array.isArray(parsed.gridData)) {
          setGridData(parsed.gridData);
        }
        if (parsed.title) {
          setDocName(parsed.title);
        }
      }
    } catch (e) {
      console.warn('Could not parse excel draft:', e);
    }
  }, []);

  const handleCellChange = (r: number, c: number, val: string) => {
    const updated = [...gridData];
    if (!updated[r]) updated[r] = [];
    updated[r][c] = val;
    setGridData(updated);
    setFormulaValue(val);
    setIsSaved(false);
  };

  const handleCellClick = (r: number, c: number) => {
    setSelectedCell({ r, c });
    setFormulaValue(gridData[r]?.[c] || '');
  };

  const evaluateFormula = (valToEval?: string) => {
    const formula = (valToEval !== undefined ? valToEval : formulaValue).trim();
    if (!formula.startsWith('=')) return;

    try {
      const expr = formula.substring(1).toUpperCase();
      if (expr.startsWith('SUM')) {
        const sum = gridData[selectedCell.r]
          .slice(1, 5)
          .reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
        handleCellChange(selectedCell.r, selectedCell.c, String(sum));
        toast.success(`Calculated SUM: ₹${sum.toLocaleString()}`);
      } else if (expr.startsWith('AVG') || expr.startsWith('AVERAGE')) {
        const vals = gridData[selectedCell.r].slice(1, 5).map((v) => parseFloat(v) || 0);
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        handleCellChange(selectedCell.r, selectedCell.c, String(avg.toFixed(2)));
        toast.success(`Calculated AVERAGE: ${avg.toFixed(2)}`);
      } else if (expr.startsWith('MAX')) {
        const vals = gridData[selectedCell.r].slice(1, 5).map((v) => parseFloat(v) || 0);
        const max = Math.max(...vals);
        handleCellChange(selectedCell.r, selectedCell.c, String(max));
        toast.success(`Calculated MAX: ${max}`);
      } else if (expr.startsWith('MIN')) {
        const vals = gridData[selectedCell.r].slice(1, 5).map((v) => parseFloat(v) || 0);
        const min = Math.min(...vals);
        handleCellChange(selectedCell.r, selectedCell.c, String(min));
        toast.success(`Calculated MIN: ${min}`);
      } else {
        // Direct arithmetic evaluator
        // eslint-disable-next-line no-eval
        const cleanExpr = expr.replace(/[^0-9+\-*/().]/g, '');
        const res = Function(`'use strict'; return (${cleanExpr})`)();
        handleCellChange(selectedCell.r, selectedCell.c, String(res));
        toast.success(`Calculated: ${res}`);
      }
    } catch {
      toast.error('Invalid formula syntax. e.g. =SUM(B2:E2) or =100*1.18');
    }
  };

  const handleAddRow = () => {
    const newRow = new Array(headers.length).fill('');
    newRow[0] = `Item ${gridData.length + 1}`;
    setGridData([...gridData, newRow]);
    setIsSaved(false);
    toast.success('Added row to worksheet');
  };

  const handleAddColumn = () => {
    const colLetter = String.fromCharCode(65 + headers.length);
    const newColName = `Column ${colLetter}`;
    setHeaders([...headers, newColName]);
    setGridData(gridData.map((row) => [...row, '']));
    setIsSaved(false);
    toast.success(`Added ${newColName}`);
  };

  const handleDeleteSelectedRow = () => {
    if (gridData.length <= 1) {
      toast.error('Cannot delete the only row');
      return;
    }
    const targetRowIdx = selectedCell.r;
    setGridData(gridData.filter((_, i) => i !== targetRowIdx));
    setSelectedCell((prev) => ({ ...prev, r: Math.max(0, prev.r - 1) }));
    setIsSaved(false);
    toast.success(`Deleted Row ${targetRowIdx + 1}`);
  };

  const handleCopyRow = () => {
    const row = gridData[selectedCell.r];
    if (!row) return;
    const rowText = row.join('\t');
    navigator.clipboard.writeText(rowText);
    toast.success(`Copied Row ${selectedCell.r + 1} to clipboard!`);
  };

  const handleDuplicateRow = () => {
    const row = gridData[selectedCell.r];
    if (!row) return;
    const newRows = [...gridData.slice(0, selectedCell.r + 1), [...row], ...gridData.slice(selectedCell.r + 1)];
    setGridData(newRows);
    setIsSaved(false);
    toast.success(`Duplicated Row ${selectedCell.r + 1}`);
  };

  const handleClearRow = () => {
    const updated = [...gridData];
    updated[selectedCell.r] = new Array(headers.length).fill('');
    setGridData(updated);
    setIsSaved(false);
    toast.success(`Cleared Row ${selectedCell.r + 1}`);
  };

  const handleDeleteSelectedColumn = () => {
    if (headers.length <= 1) {
      toast.error('Cannot delete the only column');
      return;
    }
    const targetColIdx = selectedCell.c;
    setHeaders(headers.filter((_, i) => i !== targetColIdx));
    setGridData(gridData.map((row) => row.filter((_, i) => i !== targetColIdx)));
    setSelectedCell((prev) => ({ ...prev, c: Math.max(0, prev.c - 1) }));
    setIsSaved(false);
    toast.success(`Deleted Column ${String.fromCharCode(65 + targetColIdx)}`);
  };

  const handleCopyColumn = () => {
    const colValues = [headers[selectedCell.c], ...gridData.map((r) => r[selectedCell.c] || '')];
    navigator.clipboard.writeText(colValues.join('\n'));
    toast.success(`Copied Column ${String.fromCharCode(65 + selectedCell.c)} to clipboard!`);
  };

  const handleClearColumn = () => {
    const targetColIdx = selectedCell.c;
    setGridData(
      gridData.map((row) => {
        const copy = [...row];
        copy[targetColIdx] = '';
        return copy;
      })
    );
    setIsSaved(false);
    toast.success(`Cleared Column ${String.fromCharCode(65 + targetColIdx)}`);
  };

  const handleClearAllData = () => {
    setGridData(gridData.map(() => new Array(headers.length).fill('')));
    setFormulaValue('');
    setIsSaved(false);
    toast.success('Cleared all spreadsheet data!');
  };

  const handleCopyAllTable = () => {
    const tableText = [headers.join('\t'), ...gridData.map((r) => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tableText);
    toast.success('Copied entire spreadsheet table to clipboard!');
  };

  const handleDeleteRow = () => {
    if (gridData.length <= 1) return;
    setGridData(gridData.slice(0, -1));
    setIsSaved(false);
    toast.info('Removed bottom row');
  };

  const handleSortAZ = () => {
    const colIdx = selectedCell.c;
    const sorted = [...gridData].sort((a, b) => (a[colIdx] || '').localeCompare(b[colIdx] || '', undefined, { numeric: true }));
    setGridData(sorted);
    setIsSaved(false);
    toast.success(`Sorted grid by Column ${String.fromCharCode(65 + colIdx)} (A-Z)`);
  };

  const handleSortZA = () => {
    const colIdx = selectedCell.c;
    const sorted = [...gridData].sort((a, b) => (b[colIdx] || '').localeCompare(a[colIdx] || '', undefined, { numeric: true }));
    setGridData(sorted);
    setIsSaved(false);
    toast.success(`Sorted grid by Column ${String.fromCharCode(65 + colIdx)} (Z-A)`);
  };

  const handleCreateNewWorkbook = (type: 'blank' | 'budget') => {
    if (type === 'blank') {
      setHeaders(['Column A', 'Column B', 'Column C', 'Column D', 'Column E']);
      setGridData(Array(10).fill(0).map(() => Array(5).fill('')));
      setDocName('Untitled_Workbook.xlsx');
    } else {
      setHeaders(defaultHeaders);
      setGridData([
        ['Enterprise SaaS', '125000', '168000', '210000', '290000', '793000', '42%', '+12.4%'],
        ['Self-Serve Pro', '45000', '58000', '74000', '98000', '275000', '35%', '+8.2%'],
        ['Total Gross Revenue', '218000', '300000', '366000', '513000', '1397000', '45%', '+10.8%'],
      ]);
      setDocName('Corporate_Budget_Plan.xlsx');
    }
    setIsNewBookModalOpen(false);
    setIsSaved(true);
    toast.success('Created new spreadsheet model!');
  };

  const handleImportSpreadsheet = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      toast.info(`Parsing ${file.name}...`);
      const parsed = await parseSpreadsheet(file);
      setHeaders(parsed.headers);
      setGridData(parsed.rows);
      if (parsed.sheetNames && parsed.sheetNames.length > 0) {
        setSheets(parsed.sheetNames);
        setActiveSheet(parsed.activeSheet || parsed.sheetNames[0]);
      }
      setDocName(file.name);
      setIsSaved(true);
      toast.success(`Imported "${file.name}" with ${parsed.rows.length} rows!`);
    } catch (err: any) {
      console.error('Spreadsheet import error:', err);
      toast.error(`Failed to import spreadsheet: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleExportCSV = () => {
    const csvRows = [headers.join(','), ...gridData.map((row) => row.join(','))];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const baseName = docName.substring(0, docName.lastIndexOf('.')) || docName;
    link.download = `${baseName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${baseName}.csv`);
  };

  // Compute dynamic chart data from grid rows
  const chartData = gridData.slice(0, 5).map((row) => ({
    name: row[0],
    Q1: parseFloat(row[1]) || 0,
    Q2: parseFloat(row[2]) || 0,
    Q3: parseFloat(row[3]) || 0,
    Q4: parseFloat(row[4]) || 0,
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-9.5rem)] lg:h-[calc(100vh-6rem)] rounded-2xl sm:rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
      {/* Hidden Spreadsheet File Picker */}
      <input
        type="file"
        ref={csvFileInputRef}
        accept=".xlsx,.xls,.csv,.tsv,.txt"
        onChange={(e) => handleImportSpreadsheet(e.target.files)}
        className="hidden"
      />

      {/* MS Excel Green Top Title Bar */}
      <div className="flex items-center justify-between px-2.5 sm:px-5 py-2 bg-[#107c41] dark:bg-[#0b532c] text-white shadow-sm select-none">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
          <div className="p-1 sm:p-1.5 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs shrink-0">
            <TableIcon className="w-4 h-4 text-white" />
          </div>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="text-xs sm:text-sm font-bold bg-transparent border-b border-transparent hover:border-white/40 focus:border-white focus:outline-none px-1 text-white truncate max-w-[120px] xs:max-w-[170px] sm:max-w-xs"
          />
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] text-white/90 shrink-0">
            <FileCheck className="w-3 h-3 text-emerald-200" />
            {isSaved ? 'Synced to Cloud' : 'Unsaved edits'}
          </span>
        </div>

        {/* Desktop Header Action Buttons */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsNewBookModalOpen(true)}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3"
            leftIcon={<FilePlus className="w-3.5 h-3.5" />}
          >
            <span>New Sheet</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => csvFileInputRef.current?.click()}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3"
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            <span>Import Excel</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const csvContent = [headers.join(','), ...gridData.map((row) => row.join(','))].join('\n');
              await uploadToGoogleDrive(docName, csvContent, 'application/vnd.google-apps.spreadsheet');
            }}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3"
            leftIcon={<Upload className="w-3.5 h-3.5 text-blue-200" />}
          >
            <span>Drive Sync</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportCSV}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3"
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            <span>Export</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowChart(!showChart);
              if (!showChart) toast.success('📊 Spreadsheet Chart Activated');
            }}
            className={`text-xs px-2 sm:px-3 transition-all ${
              showChart
                ? 'bg-emerald-500 text-white font-bold shadow-xs ring-1 ring-white/40'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
            leftIcon={<BarChart2 className="w-3.5 h-3.5 text-amber-300" />}
          >
            <span>{showChart ? 'Chart: Active' : 'Activate Chart'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              exportTableToPDF(headers, gridData, docName);
              toast.success('Downloaded spreadsheet as PDF!');
            }}
            className="text-white hover:bg-white/10 text-xs px-2 sm:px-3 bg-white/10"
            leftIcon={<Printer className="w-3.5 h-3.5 text-amber-200" />}
          >
            <span>PDF</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAIAnalyst(!showAIAnalyst)}
            className={`text-xs px-2 sm:px-3 ${showAIAnalyst ? 'bg-purple-600 text-white shadow-glow' : 'text-emerald-100 hover:bg-white/10'}`}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />}
          >
            <span>AI Analyst</span>
          </Button>
        </div>

        {/* Mobile Header Action Buttons (Never Overlapping) */}
        <div className="flex sm:hidden items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              exportTableToPDF(headers, gridData, docName);
              toast.success('Downloaded spreadsheet as PDF!');
            }}
            className="text-white hover:bg-white/10 text-xs px-2 bg-white/10"
            leftIcon={<Printer className="w-3.5 h-3.5 text-amber-200" />}
          >
            <span>PDF</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAIAnalyst(!showAIAnalyst)}
            className={`text-xs px-2 ${showAIAnalyst ? 'bg-purple-600 text-white shadow-glow' : 'text-emerald-100 hover:bg-white/10'}`}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />}
          >
            <span>AI</span>
          </Button>

          <div className="relative">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg text-white hover:bg-white/15 transition-colors"
              title="More Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMobileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMobileMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-in fade-in duration-150 text-slate-800 dark:text-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-3 py-1">
                    Spreadsheet Options
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsNewBookModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left"
                  >
                    <FilePlus className="w-4 h-4 text-emerald-500" />
                    <span>New Sheet</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      csvFileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left"
                  >
                    <Upload className="w-4 h-4 text-blue-500" />
                    <span>Import Excel / CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowChart(!showChart);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left"
                  >
                    <BarChart2 className="w-4 h-4 text-amber-500" />
                    <span>{showChart ? 'Hide Chart' : 'Show Chart'}</span>
                  </button>
                  <button
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      const csvContent = [headers.join(','), ...gridData.map((row) => row.join(','))].join('\n');
                      await uploadToGoogleDrive(docName, csvContent, 'application/vnd.google-apps.spreadsheet');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left"
                  >
                    <Upload className="w-4 h-4 text-indigo-500" />
                    <span>Drive Sync</span>
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleExportCSV();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Export (.csv)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MS Excel Ribbon Navigation Tabs */}
      <div className="no-scrollbar flex items-center gap-1 px-2 sm:px-4 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto whitespace-nowrap select-none py-1">
        {[
          { id: 'home', label: 'Home' },
          { id: 'insert', label: 'Insert' },
          { id: 'formulas', label: 'Formulas' },
          { id: 'data', label: 'Data' },
          { id: 'view', label: 'View' },
          { id: 'ai', label: 'AI Analyst' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveRibbonTab(tab.id as any)}
            className={`px-3 sm:px-4 py-1.5 rounded-lg border font-medium transition-all whitespace-nowrap ${
              activeRibbonTab === tab.id
                ? 'border-slate-300 dark:border-slate-700 text-[#107c41] dark:text-emerald-400 bg-white dark:bg-slate-800 font-bold shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MS Excel Ribbon Toolbar */}
      <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-2 overflow-x-auto shadow-xs">
        {/* TAB 1: HOME */}
        {activeRibbonTab === 'home' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            {/* Table Bulk Tools */}
            <div className="flex items-center gap-1 pr-2 border-r border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={handleCopyAllTable} title="Copy entire table to clipboard">
                📋 Copy All
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAllData} className="text-rose-500 hover:text-rose-600" title="Clear all cell values">
                🗑️ Clear All
              </Button>
            </div>

            {/* Row Controls */}
            <div className="flex items-center gap-1 pr-2 border-r border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" leftIcon={<ArrowDown className="w-3.5 h-3.5 text-emerald-500" />} onClick={handleAddRow}>
                + Row
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyRow} title="Copy selected row">
                Copy Row
              </Button>
              <Button variant="outline" size="sm" onClick={handleDuplicateRow} title="Duplicate selected row">
                Dup Row
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDeleteSelectedRow} className="text-rose-500" title="Delete selected row">
                - Row
              </Button>
            </div>

            {/* Column Controls */}
            <div className="flex items-center gap-1 pr-2 border-r border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" leftIcon={<ArrowRight className="w-3.5 h-3.5 text-emerald-500" />} onClick={handleAddColumn}>
                + Col
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyColumn} title="Copy selected column">
                Copy Col
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDeleteSelectedColumn} className="text-rose-500" title="Delete selected column">
                - Col
              </Button>
            </div>

            {/* Quick Number Formats */}
            <div className="flex items-center gap-1 pr-2 border-r border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  const val = gridData[selectedCell.r]?.[selectedCell.c] || '0';
                  const num = parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
                  handleCellChange(selectedCell.r, selectedCell.c, `₹${num.toLocaleString()}`);
                }}
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                title="Format as Currency (₹)"
              >
                ₹
              </button>
              <button
                onClick={() => {
                  const val = gridData[selectedCell.r]?.[selectedCell.c] || '0';
                  const num = parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
                  handleCellChange(selectedCell.r, selectedCell.c, `${num}%`);
                }}
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                title="Format as Percentage (%)"
              >
                %
              </button>
              <button
                onClick={() => {
                  const val = gridData[selectedCell.r]?.[selectedCell.c] || '0';
                  const num = parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
                  handleCellChange(selectedCell.r, selectedCell.c, num.toFixed(2));
                }}
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 font-mono text-[11px]"
                title="2 Decimal Places (.00)"
              >
                .00
              </button>
            </div>

            {/* Sort & Filter */}
            <div className="flex items-center gap-1">
              <button onClick={handleSortAZ} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort A-Z
              </button>
              <button onClick={handleSortZA} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 rotate-180" /> Sort Z-A
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: INSERT */}
        {activeRibbonTab === 'insert' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <Button
              variant={showChart && chartType === 'bar' ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<BarChart2 className="w-4 h-4 text-emerald-500" />}
              onClick={() => {
                setChartType('bar');
                setShowChart(true);
              }}
            >
              Bar Chart
            </Button>
            <Button
              variant={showChart && chartType === 'line' ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<TrendingUp className="w-4 h-4 text-blue-500" />}
              onClick={() => {
                setChartType('line');
                setShowChart(true);
              }}
            >
              Line Trend Chart
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const totalRow = new Array(headers.length).fill('0');
                totalRow[0] = 'Summary Total';
                for (let c = 1; c < headers.length; c++) {
                  const colSum = gridData.reduce((acc, row) => acc + (parseFloat(row[c]) || 0), 0);
                  totalRow[c] = String(colSum);
                }
                setGridData([...gridData, totalRow]);
                toast.success('Inserted Summary Total row');
              }}
            >
              Insert Summary Row
            </Button>
          </div>
        )}

        {/* TAB 3: FORMULAS */}
        {activeRibbonTab === 'formulas' && (
          <div className="flex items-center gap-1.5 min-w-max text-xs">
            <Button variant="outline" size="sm" onClick={() => evaluateFormula('=SUM()')}>
              ∑ AutoSum
            </Button>
            <Button variant="outline" size="sm" onClick={() => evaluateFormula('=AVERAGE()')}>
              AVERAGE
            </Button>
            <Button variant="outline" size="sm" onClick={() => evaluateFormula('=MAX()')}>
              MAX
            </Button>
            <Button variant="outline" size="sm" onClick={() => evaluateFormula('=MIN()')}>
              MIN
            </Button>
            <Button variant="outline" size="sm" onClick={() => evaluateFormula('=COUNT()')}>
              COUNT Numbers
            </Button>
          </div>
        )}

        {/* TAB 4: DATA */}
        {activeRibbonTab === 'data' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4 text-amber-500" />} onClick={() => toast.success('Data filter enabled on table headers')}>
              AutoFilter
            </Button>
            <Button variant="outline" size="sm" onClick={handleSortAZ}>
              Sort Ascending
            </Button>
            <Button variant="outline" size="sm" onClick={handleSortZA}>
              Sort Descending
            </Button>
          </div>
        )}

        {/* TAB 5: VIEW */}
        {activeRibbonTab === 'view' && (
          <div className="flex items-center gap-3 min-w-max text-xs">
            <button
              onClick={() => setShowChart(!showChart)}
              className={`px-3 py-1.5 rounded text-xs font-semibold ${showChart ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
            >
              Toggle Visual Chart Sidepanel
            </button>
          </div>
        )}

        {/* TAB 6: AI ANALYST */}
        {activeRibbonTab === 'ai' && (
          <div className="flex items-center gap-2 min-w-max text-xs">
            <Button
              variant="gradient"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={() => {
                setShowAIAnalyst(true);
                toast.success('AI Data Analyst activated');
              }}
            >
              Analyze Trends & Growth
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleCellChange(selectedCell.r, selectedCell.c, '=SUM(B2:E2)');
                evaluateFormula('=SUM(B2:E2)');
              }}
            >
              Auto-generate Formula at Cell
            </Button>
          </div>
        )}
      </div>

      {/* Formula Bar */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-700 dark:text-slate-300">
          <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs">
            {String.fromCharCode(65 + selectedCell.c)}{selectedCell.r + 1}
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-serif italic text-sm">fx</span>
        </div>

        <input
          type="text"
          value={formulaValue}
          onChange={(e) => {
            setFormulaValue(e.target.value);
            handleCellChange(selectedCell.r, selectedCell.c, e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') evaluateFormula();
          }}
          placeholder="Enter values or formula e.g. =SUM(B2:E2), =AVERAGE(B2:E2), =100*1.18..."
          className="flex-1 px-3 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        <Button variant="primary" size="sm" onClick={() => evaluateFormula()} className="px-2.5 py-1 text-xs">
          Enter
        </Button>
      </div>

      {/* Main Spreadsheet Grid + Charts Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Interactive Grid Canvas Viewport */}
        <div className="flex-1 overflow-auto bg-white dark:bg-slate-900">
          <table className="w-full border-collapse text-xs select-none">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950 text-slate-500 font-mono sticky top-0 z-10">
                <th className="w-10 p-2 border border-slate-200 dark:border-slate-800 text-center font-normal">#</th>
                {headers.map((h, i) => (
                  <th key={i} className="min-w-[130px] p-2 border border-slate-200 dark:border-slate-800 text-left font-bold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[#107c41] dark:text-emerald-400 font-bold">{String.fromCharCode(65 + i)}</span>
                      <span className="text-[11px] font-normal text-slate-400 font-sans truncate">{h}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridData.map((row, r) => (
                <tr key={r} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-2 border border-slate-200 dark:border-slate-800 text-center font-mono text-slate-400 bg-slate-50 dark:bg-slate-950 select-none">
                    {r + 1}
                  </td>
                  {row.map((cell, c) => {
                    const isSelected = selectedCell.r === r && selectedCell.c === c;
                    return (
                      <td
                        key={c}
                        onClick={() => handleCellClick(r, c)}
                        className={`p-0.5 border border-slate-200 dark:border-slate-800 ${
                          isSelected ? 'ring-2 ring-emerald-500 z-10 bg-emerald-50/30 dark:bg-emerald-950/40' : ''
                        }`}
                      >
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => handleCellChange(r, c, e.target.value)}
                          className="w-full bg-transparent px-2 py-1 text-slate-900 dark:text-slate-100 font-sans text-xs focus:outline-none"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dynamic Chart Drawer */}
        {showChart && (
          <div className="w-80 lg:w-96 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Live Spreadsheet Visualizer
                </span>
                <Badge variant="success" size="sm">Auto-Sync</Badge>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                      <YAxis fontSize={10} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', fontSize: '11px' }} />
                      <Bar dataKey="Q1" fill="#107c41" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Q4" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                      <YAxis fontSize={10} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', fontSize: '11px' }} />
                      <Line type="monotone" dataKey="Q1" stroke="#107c41" strokeWidth={2} />
                      <Line type="monotone" dataKey="Q4" stroke="#6366f1" strokeWidth={2} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Insights Box */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2 mt-4">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <Sparkles className="w-4 h-4" /> AI Spreadsheet Insights
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Enterprise SaaS target expanded <strong>+42% in Q4</strong>. Total annual revenue run-rate reached <strong>₹1.39M</strong> with positive margin delta.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet Navigation Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs select-none">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {sheets.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSheet(s)}
              className={`px-3 py-1 rounded-t-lg font-semibold transition-all whitespace-nowrap ${
                activeSheet === s
                  ? 'bg-white dark:bg-slate-900 text-[#107c41] dark:text-emerald-400 shadow-xs border-t-2 border-[#107c41]'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => {
              const name = `Sheet ${sheets.length + 1}`;
              setSheets([...sheets, name]);
              toast.success(`Created ${name}`);
            }}
            className="p-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 hover:text-slate-900"
            title="Add New Sheet"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
          {gridData.length} Rows × {headers.length} Columns • Cell {String.fromCharCode(65 + selectedCell.c)}{selectedCell.r + 1}
        </div>
      </div>

      {/* New Spreadsheet Modal */}
      <Modal
        isOpen={isNewBookModalOpen}
        onClose={() => setIsNewBookModalOpen(false)}
        title="Create New Spreadsheet"
        description="Choose a blank workbook or financial template"
      >
        <div className="grid grid-cols-2 gap-3 py-2">
          <div
            onClick={() => handleCreateNewWorkbook('blank')}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/30 cursor-pointer transition-all"
          >
            <GridIcon className="w-6 h-6 text-emerald-500 mb-2" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">Blank Workbook</div>
            <div className="text-[11px] text-slate-500 mt-1">Empty grid for custom calculations</div>
          </div>

          <div
            onClick={() => handleCreateNewWorkbook('budget')}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/30 cursor-pointer transition-all"
          >
            <DollarSign className="w-6 h-6 text-blue-500 mb-2" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">Budget & Expense Model</div>
            <div className="text-[11px] text-slate-500 mt-1">Pre-formatted expense breakdown</div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
