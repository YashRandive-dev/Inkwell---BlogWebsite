import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PostForm from '../components/blog/PostForm';
import Loader from '../components/common/Loader';
import NotFound from './NotFound';

export default function EditPost() {
  const { slug } = useParams();
  const { user, isAdmin } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get(`/posts/${slug}`)
      .then((res) => active && setPost(res.data.data.post))
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 404) setMissing(true);
        else toast.error(err.message);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <Loader />;
  if (missing || !post) return <NotFound />;

  // The API enforces this too; this just gives a friendlier screen.
  if (!isAdmin && post.author._id !== user._id) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">You can only edit your own posts</h1>
      </div>
    );
  }

  return (
    <div className="container-page max-w-4xl py-10 sm:py-14">
      <Helmet>
        <title>{`Edit: ${post.title} – Inkwell`}</title>
      </Helmet>
      <h1 className="mb-8 text-3xl font-extrabold">Edit post</h1>
      <PostForm post={post} />
    </div>
  );
}
