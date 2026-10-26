import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import toast from 'react-hot-toast';
import { FiImage, FiX } from 'react-icons/fi';
import api from '../../api/axios';
import Button from '../common/Button';
import { optimizeImage } from '../../utils/helpers';

const MAX_SIZE = 2 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Shared by CreatePost and EditPost. `post` is provided when editing.
export default function PostForm({ post }) {
  const navigate = useNavigate();
  const quillRef = useRef(null);
  const fileInput = useRef(null);
  const inlineInput = useRef(null);

  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState(post?.title || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [content, setContent] = useState(post?.content || '');
  const [category, setCategory] = useState(post?.category?._id || '');
  const [tags, setTags] = useState((post?.tags || []).join(', '));
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(post?.coverImage?.url || '');
  const [removeCover, setRemoveCover] = useState(false);
  const [saving, setSaving] = useState(null); // 'draft' | 'published' | null

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data.data.categories))
      .catch((err) => toast.error(err.message));
  }, []);

  // Free the temporary preview URL when it changes / on unmount.
  useEffect(() => () => coverPreview.startsWith('blob:') && URL.revokeObjectURL(coverPreview), [coverPreview]);

  const pickCover = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!TYPES.includes(file.type)) return toast.error('Only jpg, png and webp images are allowed');
    if (file.size > MAX_SIZE) return toast.error('Image must be 2MB or smaller');
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setRemoveCover(false);
  };

  const clearCover = () => {
    setCoverFile(null);
    setCoverPreview('');
    setRemoveCover(true);
  };

  // Image button in the editor: choose a file, upload it, insert the returned URL.
  const handleInlineImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!TYPES.includes(file.type)) return toast.error('Only jpg, png and webp images are allowed');
    if (file.size > MAX_SIZE) return toast.error('Image must be 2MB or smaller');

    const loadingToast = toast.loading('Uploading image…');
    try {
      const body = new FormData();
      body.append('image', file);
      const res = await api.post('/posts/upload-image', body);
      const editor = quillRef.current.getEditor();
      const index = editor.getSelection(true)?.index ?? editor.getLength();
      editor.insertEmbed(index, 'image', res.data.data.url);
      editor.setSelection(index + 1);
      toast.success('Image added', { id: loadingToast });
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  // Toolbar config. Must stay memoised or Quill re-creates itself on every keystroke.
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: { image: () => inlineInput.current?.click() },
      },
    }),
    []
  );

  const isContentEmpty = !content || content.replace(/<[^>]*>/g, '').trim() === '' && !content.includes('<img');

  const submit = async (status) => {
    if (!title.trim()) return toast.error('Please add a title');
    if (!category) return toast.error('Please choose a category');
    if (isContentEmpty) return toast.error('Your post has no content yet');

    const body = new FormData();
    body.append('title', title.trim());
    body.append('excerpt', excerpt.trim());
    body.append('content', content);
    body.append('category', category);
    body.append('status', status);
    body.append('tags', JSON.stringify(tags.split(',').map((t) => t.trim()).filter(Boolean)));
    if (coverFile) body.append('coverImage', coverFile);
    if (removeCover && !coverFile) body.append('removeCoverImage', 'true');

    setSaving(status);
    try {
      const res = post ? await api.put(`/posts/${post._id}`, body) : await api.post('/posts', body);
      const saved = res.data.data.post;
      toast.success(post ? 'Post updated' : status === 'published' ? 'Post published!' : 'Draft saved');
      navigate(saved.status === 'published' ? `/blog/${saved.slug}` : '/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <div>
        <label htmlFor="title" className="label">Title</label>
        <input id="title" className="input text-lg font-semibold" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} placeholder="An engaging title" />
      </div>

      <div>
        <span className="label">Cover image <span className="font-normal text-slate-400">(jpg, png or webp, up to 2MB)</span></span>
        {coverPreview ? (
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
            <img src={coverPreview.startsWith('blob:') ? coverPreview : optimizeImage(coverPreview, 1000)} alt="Cover preview" className="aspect-[16/7] w-full object-cover" />
            <button type="button" onClick={clearCover} aria-label="Remove cover image" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900">
              <FiX />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-10 text-sm text-slate-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700"
          >
            <FiImage size={24} /> Click to choose a cover image
          </button>
        )}
        <input ref={fileInput} type="file" accept={TYPES.join(',')} className="hidden" onChange={pickCover} />
        <input ref={inlineInput} type="file" accept={TYPES.join(',')} className="hidden" onChange={handleInlineImage} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="label">Category</label>
          <select id="category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tags" className="label">Tags <span className="font-normal text-slate-400">(comma separated)</span></label>
          <input id="tags" className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="react, tutorial, tips" />
        </div>
      </div>

      <div>
        <label htmlFor="excerpt" className="label">Excerpt <span className="font-normal text-slate-400">({excerpt.length}/300 – leave empty to generate one)</span></label>
        <textarea id="excerpt" className="input min-h-[80px]" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={300} placeholder="A short summary shown on post cards and in search results" />
      </div>

      <div>
        <span className="label">Content</span>
        <div className="editor">
          <ReactQuill ref={quillRef} theme="snow" value={content} onChange={setContent} modules={modules} placeholder="Tell your story…" />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
        <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        {(!post || post.status === 'draft') && (
          <Button variant="secondary" loading={saving === 'draft'} disabled={!!saving} onClick={() => submit('draft')}>
            Save as draft
          </Button>
        )}
        <Button loading={saving === 'published'} disabled={!!saving} onClick={() => submit('published')}>
          {post && post.status === 'published' ? 'Update post' : 'Publish'}
        </Button>
      </div>
    </form>
  );
}
