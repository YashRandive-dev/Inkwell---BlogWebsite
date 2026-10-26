import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCornerDownRight, FiEdit2, FiMessageCircle, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { Skeleton } from '../common/Loader';
import { timeAgo } from '../../utils/helpers';

// Small textarea + submit used for new comments, replies and edits.
function CommentForm({ initial = '', placeholder, submitLabel, onSubmit, onCancel, autoFocus = false }) {
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      await onSubmit(text.trim());
      setText('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        aria-label={placeholder}
        className="input min-h-[80px] resize-y"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        maxLength={1000}
        autoFocus={autoFocus}
        required
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" loading={saving} disabled={!text.trim()}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function CommentItem({ comment, replies = [], user, isAdmin, activeAction, setActiveAction, onReply, onEdit, onDelete, isReply = false }) {
  const mine = user && comment.user?._id === user._id;
  const canDelete = mine || isAdmin;
  const editing = activeAction?.type === 'edit' && activeAction.id === comment._id;
  const replying = activeAction?.type === 'reply' && activeAction.id === comment._id;

  return (
    <motion.li layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="list-none">
      <div className="flex gap-3">
        <Avatar user={comment.user} size={isReply ? 'sm' : 'md'} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link to={`/author/${comment.user?._id}`} className="text-sm font-semibold text-slate-900 hover:text-brand-600 dark:text-white">
              {comment.user?.name || 'Deleted user'}
            </Link>
            <time className="text-xs text-slate-400" dateTime={comment.createdAt}>
              {timeAgo(comment.createdAt)}
              {comment.updatedAt !== comment.createdAt && ' · edited'}
            </time>
          </div>

          {editing ? (
            <div className="mt-2">
              <CommentForm
                initial={comment.content}
                placeholder="Edit your comment"
                submitLabel="Save"
                autoFocus
                onSubmit={(text) => onEdit(comment, text)}
                onCancel={() => setActiveAction(null)}
              />
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {comment.content}
            </p>
          )}

          {!editing && (
            <div className="mt-1.5 flex gap-3 text-xs text-slate-500">
              {user && (
                <button className="flex items-center gap-1 hover:text-brand-600" onClick={() => setActiveAction({ type: 'reply', id: comment._id })}>
                  <FiCornerDownRight /> Reply
                </button>
              )}
              {mine && (
                <button className="flex items-center gap-1 hover:text-brand-600" onClick={() => setActiveAction({ type: 'edit', id: comment._id })}>
                  <FiEdit2 /> Edit
                </button>
              )}
              {canDelete && (
                <button className="flex items-center gap-1 hover:text-red-600" onClick={() => onDelete(comment)}>
                  <FiTrash2 /> Delete
                </button>
              )}
            </div>
          )}

          {replying && (
            <div className="mt-3">
              <CommentForm
                placeholder={`Reply to ${comment.user?.name || 'comment'}`}
                submitLabel="Reply"
                autoFocus
                onSubmit={(text) => onReply(comment, text)}
                onCancel={() => setActiveAction(null)}
              />
            </div>
          )}

          {replies.length > 0 && (
            <ul className="mt-4 space-y-4 border-l-2 border-slate-100 pl-4 dark:border-slate-800">
              {replies.map((r) => (
                <CommentItem
                  key={r._id}
                  comment={r}
                  user={user}
                  isAdmin={isAdmin}
                  activeAction={activeAction}
                  setActiveAction={setActiveAction}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isReply
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.li>
  );
}

export default function CommentSection({ postId }) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState(null); // { type: 'reply' | 'edit', id }
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(res.data.data.comments);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Top-level comments (newest first) with their replies (oldest first).
  const { topLevel, repliesByParent } = useMemo(() => {
    const map = {};
    const tops = [];
    comments.forEach((c) => {
      if (c.parentComment) (map[c.parentComment] = map[c.parentComment] || []).push(c);
      else tops.push(c);
    });
    return { topLevel: tops.reverse(), repliesByParent: map };
  }, [comments]);

  const addComment = async (content, parentComment = null) => {
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content, parentComment });
      setComments((prev) => [...prev, res.data.data.comment]);
      setActiveAction(null);
      toast.success(parentComment ? 'Reply added' : 'Comment added');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const editComment = async (comment, content) => {
    try {
      const res = await api.put(`/comments/${comment._id}`, { content });
      setComments((prev) => prev.map((c) => (c._id === comment._id ? res.data.data.comment : c)));
      setActiveAction(null);
      toast.success('Comment updated');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/comments/${toDelete._id}`);
      setComments((prev) => prev.filter((c) => c._id !== toDelete._id && c.parentComment !== toDelete._id));
      toast.success('Comment deleted');
      setToDelete(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section aria-labelledby="comments-heading" className="mx-auto mt-16 max-w-[720px]">
      <h2 id="comments-heading" className="mb-6 flex items-center gap-2 text-xl font-bold">
        <FiMessageCircle /> Comments {!loading && <span className="text-slate-400">({comments.length})</span>}
      </h2>

      {user ? (
        <div className="mb-8 flex gap-3">
          <Avatar user={user} />
          <div className="flex-1">
            <CommentForm placeholder="Share your thoughts…" submitLabel="Post comment" onSubmit={(text) => addComment(text)} />
          </div>
        </div>
      ) : (
        <div className="card mb-8 p-5 text-center text-sm">
          <Link to="/login" state={{ from: window.location.pathname }} className="font-semibold text-brand-600 hover:underline">Log in</Link>{' '}
          or <Link to="/register" className="font-semibold text-brand-600 hover:underline">sign up</Link> to join the conversation.
        </div>
      )}

      {loading ? (
        <div className="space-y-5" role="status" aria-label="Loading comments">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No comments yet – be the first to share your thoughts.</p>
      ) : (
        <ul className="space-y-6">
          <AnimatePresence initial={false}>
            {topLevel.map((c) => (
              <CommentItem
                key={c._id}
                comment={c}
                replies={repliesByParent[c._id] || []}
                user={user}
                isAdmin={isAdmin}
                activeAction={activeAction}
                setActiveAction={setActiveAction}
                onReply={(parent, text) => addComment(text, parent.parentComment || parent._id)}
                onEdit={editComment}
                onDelete={setToDelete}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete comment?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>Delete</Button>
          </>
        }
      >
        This will permanently remove the comment{toDelete && !toDelete.parentComment ? ' and its replies' : ''}.
      </Modal>
    </section>
  );
}
