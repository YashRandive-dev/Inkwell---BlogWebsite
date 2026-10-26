import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from './components/layout/Layout';
import Loader from './components/common/Loader';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import RouteProgress from './components/common/RouteProgress';

// Route-level code splitting: each page is downloaded only when first visited.
const Home = lazy(() => import('./pages/Home'));
const Blog = lazy(() => import('./pages/Blog'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const EditPost = lazy(() => import('./pages/EditPost'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Topics = lazy(() => import('./pages/Topics'));
const Writers = lazy(() => import('./pages/Writers'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Download the other pages in the background once the first page is ready,
// so clicking a link feels instant instead of waiting for the page code to load.
const prefetchPages = () => {
  [
    () => import('./pages/Blog'), () => import('./pages/PostDetail'), () => import('./pages/Login'),
    () => import('./pages/Register'), () => import('./pages/VerifyEmail'), () => import('./pages/Topics'),
    () => import('./pages/Writers'), () => import('./pages/About'), () => import('./pages/Contact'),
    () => import('./pages/Dashboard'), () => import('./pages/CreatePost'), () => import('./pages/FAQ'),
  ].forEach((load) => load().catch(() => {}));
};

export default function App() {
  const location = useLocation();

  useEffect(() => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));
    const id = idle(prefetchPages);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, []);

  return (
    <Layout>
      <RouteProgress />
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<Loader />}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/category/:category" element={<Blog />} />
              <Route path="/tag/:tag" element={<Blog />} />
              <Route path="/blog/:slug" element={<PostDetail />} />
              <Route path="/author/:id" element={<Profile />} />
              <Route path="/write" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
              <Route path="/edit/:slug" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/topics" element={<Topics />} />
              <Route path="/writers" element={<Writers />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </motion.div>
    </Layout>
  );
}
