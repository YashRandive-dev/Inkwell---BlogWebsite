const mongoose = require('mongoose');
const slugify = require('slugify');

// Removes HTML tags so we can count words / build excerpts.
const stripHtml = (html = '') =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 150 },
    slug: { type: String, unique: true, index: true },
    excerpt: { type: String, trim: true, maxlength: 300, default: '' },
    content: { type: String, required: [true, 'Content is required'] },
    coverImage: {
      url: { type: String, default: '' },
      public_id: { type: String, default: '' },
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },
    tags: [{ type: String, trim: true, lowercase: true }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 }, // kept in sync with likes.length so we can sort by it
    readingTime: { type: Number, default: 1 }, // minutes
  },
  { timestamps: true }
);

postSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });

// Create a unique, SEO-friendly slug the first time a post is saved.
postSchema.pre('validate', async function (next) {
  if (this.slug || !this.title) return next();
  const base = slugify(this.title, { lower: true, strict: true }) || 'post';
  let candidate = base;
  let counter = 1;
  while (await mongoose.models.Post.exists({ slug: candidate })) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }
  this.slug = candidate;
  next();
});

// Reading time (200 words per minute) and a fallback excerpt.
postSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    const text = stripHtml(this.content);
    const words = text ? text.split(' ').length : 0;
    this.readingTime = Math.max(1, Math.ceil(words / 200));
    if (!this.excerpt) {
      this.excerpt = text.length > 160 ? `${text.slice(0, 157)}...` : text;
    }
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);
