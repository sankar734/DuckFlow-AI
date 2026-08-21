import { create } from 'zustand';

interface UIState {
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  isMobileScannerOpen: boolean;
  openMobileScanner: () => void;
  closeMobileScanner: () => void;

  isAIDrawerOpen: boolean;
  setAIDrawerOpen: (open: boolean) => void;
  toggleAIDrawer: () => void;

  activeShareDocId: string | null;
  openShareModal: (docId: string) => void;
  closeShareModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCommandPaletteOpen: false,
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

  isMobileScannerOpen: false,
  openMobileScanner: () => set({ isMobileScannerOpen: true }),
  closeMobileScanner: () => set({ isMobileScannerOpen: false }),

  isAIDrawerOpen: true,
  setAIDrawerOpen: (open) => set({ isAIDrawerOpen: open }),
  toggleAIDrawer: () => set((state) => ({ isAIDrawerOpen: !state.isAIDrawerOpen })),

  activeShareDocId: null,
  openShareModal: (docId) => set({ activeShareDocId: docId }),
  closeShareModal: () => set({ activeShareDocId: null }),
}));
