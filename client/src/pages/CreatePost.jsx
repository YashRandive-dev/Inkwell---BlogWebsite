import { Helmet } from 'react-helmet-async';
import PostForm from '../components/blog/PostForm';

export default function CreatePost() {
  return (
    <div className="container-page max-w-4xl py-10 sm:py-14">
      <Helmet>
        <title>Write a post – Inkwell</title>
      </Helmet>
      <h1 className="mb-2 text-3xl font-extrabold">Write a new post</h1>
      <p className="mb-8 text-slate-500">Save it as a draft while you work, or publish when it&apos;s ready.</p>
      <PostForm />
    </div>
  );
}
