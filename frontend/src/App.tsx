import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppRoutes } from './routes/AppRoutes';
import { useThemeStore } from './store/themeStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export const App: React.FC = () => {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          richColors
          theme={theme === 'dark' ? 'dark' : 'light'}
          closeButton
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
