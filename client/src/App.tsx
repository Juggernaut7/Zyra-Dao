import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import Proposals from './pages/Proposals';
import ProposalDetail from './pages/ProposalDetail';
import Treasury from './pages/Treasury';
import Members from './pages/Members';
import Settings from './pages/Settings';

// Page transition wrapper
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
};

// Routes component to handle location-based animations
const AppRoutes = () => {
  const location = useLocation();
  
  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route 
            path="/" 
            element={
              <PageTransition>
                <Dashboard />
              </PageTransition>
            } 
          />
          <Route 
            path="/proposals" 
            element={
              <PageTransition>
                <Proposals />
              </PageTransition>
            } 
          />
          <Route 
            path="/proposals/:id" 
            element={
              <PageTransition>
                <ErrorBoundary>
                  <ProposalDetail />
                </ErrorBoundary>
              </PageTransition>
            } 
          />
          <Route 
            path="/treasury" 
            element={
              <PageTransition>
                <Treasury />
              </PageTransition>
            } 
          />
          <Route 
            path="/members" 
            element={
              <PageTransition>
                <Members />
              </PageTransition>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <PageTransition>
                <Settings />
              </PageTransition>
            } 
          />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#ffffff',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </Router>
  );
}

export default App;
