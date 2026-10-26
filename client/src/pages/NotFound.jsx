import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiHome } from 'react-icons/fi';
import Button from '../components/common/Button';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <Helmet>
        <title>Page not found – Inkwell</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <motion.p
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="gradient-text text-8xl font-extrabold sm:text-9xl"
      >
        404
      </motion.p>
      <h1 className="mt-4 text-2xl font-bold">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-md text-slate-500">
        The link may be broken, or the post may have been moved or deleted.
      </p>
      <div className="mt-6 flex gap-3">
        <Button to="/"><FiHome /> Back home</Button>
        <Button to="/blog" variant="secondary">Browse posts</Button>
      </div>
    </div>
  );
}
