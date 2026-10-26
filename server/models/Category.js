const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required'], unique: true, trim: true, maxlength: 40 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, default: '', maxlength: 200 },
  },
  { timestamps: true }
);

// Keep the slug in sync with the name.
categorySchema.pre('validate', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
