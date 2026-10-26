# Inkwell – MERN Blog Website

A full-stack blog platform built with **MongoDB, Express, React and Node.js** in plain JavaScript. Readers can browse and search posts; writers can publish with a rich text editor, upload cover images, like, bookmark and comment; admins manage everything from a dashboard with charts.

## Features

- **Auth:** register with **email OTP verification** (6-digit code, 10-minute expiry, 5 attempts, 60s resend cooldown), login, logout (JWT in an httpOnly cookie), session restore on refresh, forgot/reset password by email, change password, show/hide password toggle, protected and admin-only routes (frontend and backend).
- **Posts:** create, edit, delete, drafts, rich text (headings, bold, italic, lists, links, code blocks, quotes, images), cover image upload with preview (2MB, jpg/png/webp), auto slug, reading time, view counter, featured flag, related posts, share buttons.
- **Discovery:** animated home page (hero, featured, latest, popular, categories, newsletter), debounced search, category/tag filters, sorting, pagination, category and tag pages, author profile pages.
- **Engagement:** like/unlike, bookmark, comments with edit/delete and one level of replies.
- **Dashboard:** stats cards, my posts (published and drafts), saved posts, edit profile (avatar, bio, social links), change password.
- **Admin panel:** stats with Recharts charts, manage users (role, delete), posts (feature, edit, delete), comments, categories.
- **Pages:** Home, Stories, Topics, Writers, About, Contact, Help & FAQ, Privacy policy, Terms of service, plus author profiles, dashboard and admin panel.
- **Navigation:** floating glass navbar with a Topics mega menu, a Ctrl/⌘ + K live search palette, and a full footer with newsletter signup.
- **UX:** light/dark mode, responsive, skeleton loaders, page transitions, reading progress bar, back-to-top button, reduced-motion support, toasts, SEO meta tags.

## Tech stack

| Client | Server |
| --- | --- |
| React 18, Vite, React Router v6 | Node.js, Express |
| Tailwind CSS, Framer Motion | MongoDB Atlas, Mongoose |
| Axios, Context API | JWT, bcryptjs |
| React Quill (`react-quill-new`), DOMPurify | Multer, Cloudinary |
| React Hot Toast, React Icons | express-validator, helmet, cors, express-rate-limit |
| React Helmet Async, Recharts | cookie-parser, morgan, dotenv, slugify, nodemailer |

## Design

Brand colours: **Ember** (vermilion `#d4421c`) and **Marigold** (gold `#e8920e`) on warm cream / espresso neutrals. Headings use Fraunces, UI uses Inter, articles use Lora. Colours are defined once in `client/tailwind.config.js`.

## Folder structure

```
blog-website/
├── client/                 React app (Vite)
│   ├── src/
│   │   ├── api/axios.js            single Axios instance + interceptors
│   │   ├── components/layout|common|blog
│   │   ├── context/                AuthContext, ThemeContext
│   │   ├── hooks/useDebounce.js
│   │   ├── pages/                  one file per route
│   │   ├── utils/helpers.js
│   │   ├── App.jsx  main.jsx  index.css
│   ├── vercel.json                 SPA rewrite so refresh works
│   └── .env.example
└── server/                 Express API
    ├── config/             db.js, cloudinary.js
    ├── controllers/        auth, post, comment, user, category, admin, contact
    ├── middleware/         auth, error, upload, validate
    ├── models/             User, Post, Comment, Category
    ├── routes/
    ├── utils/              generateToken, sendEmail, asyncHandler, response, seed
    ├── server.js
    └── .env.example
```

Small additions to the original plan: `PostForm.jsx` (shared by create/edit), `Avatar.jsx`, `AuthCard.jsx`, `PasswordInput.jsx`, plus a contact/newsletter controller and route (`/api/contact`).

## Local setup

1. **Clone** and open the project folder.
2. **Install**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
3. **Environment files**
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
   Fill in `server/.env` (see the table below). Use a MongoDB Atlas connection string or a local `mongodb://127.0.0.1:27017/inkwell`.
   > **macOS note:** port 5000 is used by AirPlay Receiver on recent macOS versions. If requests to port 5000 return 403, set `PORT=5001` in `server/.env` and `VITE_API_URL=http://localhost:5001/api` in `client/.env`.
4. **Seed sample data** (clears users, categories, posts and comments first):
   ```bash
   cd server && npm run seed
   ```
5. **Run both apps** in two terminals:
   ```bash
   cd server && npm run dev      # API on http://localhost:5000
   cd client && npm run dev      # App on http://localhost:5173
   ```

Image uploads need Cloudinary keys. 

## Environment variables

**server/.env**

| Variable | Description |
| --- | --- |
| `PORT` | API port (default 5000) |
| `NODE_ENV` | `development` or `production` (production enables secure cross-site cookies) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string used to sign tokens |
| `JWT_EXPIRE` | Token/cookie lifetime, e.g. `7d` |
| `CLIENT_URL` | Frontend origin for CORS and reset links, e.g. `http://localhost:5173` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary credentials for uploads |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | SMTP server for emails |
| `EMAIL_FROM` | Sender address, and the inbox that receives contact messages |

**client/.env**

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Base URL of the API including `/api` |

## API endpoints

All responses use `{ success, message, data, pagination? }`.

| Area | Endpoint | Access |
| --- | --- | --- |
| Auth | `POST /auth/register` (emails a code), `POST /auth/verify-otp`, `POST /auth/resend-otp` | public |
| | `POST /auth/login`, `POST /auth/logout` | public |
| | `GET /auth/me` (returns `user: null` for guests) | public |
| | `POST /auth/forgot-password`, `PUT /auth/reset-password/:token` | public |
| | `PUT /auth/change-password` | user |
| Posts | `GET /posts` (`page, limit, search, category, tag, sort, author`) | public |
| | `GET /posts/featured`, `/posts/popular`, `/posts/tags` | public |
| | `GET /posts/:slug`, `GET /posts/:slug/related` | public (drafts: author/admin) |
| | `POST /posts`, `POST /posts/upload-image` | user |
| | `PUT /posts/:id`, `DELETE /posts/:id` | author or admin |
| | `PUT /posts/:id/like`, `PUT /posts/:id/bookmark` | user |
| Comments | `GET /posts/:postId/comments` | public |
| | `POST /posts/:postId/comments` | user |
| | `PUT /comments/:id` | author |
| | `DELETE /comments/:id` | author or admin |
| Users | `GET /users` (writers directory), `GET /users/:id` | public |
| | `PUT /users/profile`, `GET /users/me/posts`, `/users/me/bookmarks`, `/users/me/stats` | user |
| Categories | `GET /categories` | public |
| | `POST /categories`, `PUT /categories/:id`, `DELETE /categories/:id` | admin |
| Admin | `GET /admin/stats`, `/admin/users`, `/admin/posts`, `/admin/comments` | admin |
| | `PUT /admin/users/:id/role`, `DELETE /admin/users/:id`, `PUT /admin/posts/:id/feature` | admin |
| Contact | `POST /contact`, `POST /contact/subscribe` | public (rate limited) |
| Health | `GET /health` → `{ "status": "ok" }` | public |

## Deployment

### 1. MongoDB Atlas
1. Create a free cluster, then a database user (Database Access).
2. Under Network Access allow your backend host (use `0.0.0.0/0` for Render's free tier).
3. Copy the connection string into `MONGO_URI`.

![Atlas screenshot placeholder](docs/atlas.png)

### 2. Backend on Render
1. New → **Web Service**, connect the repository, set **Root Directory** to `server`.
2. Build command `npm install`, start command `npm start`.
3. Add every variable from `server/.env.example`. Set `NODE_ENV=production` and `CLIENT_URL` to your Vercel URL (no trailing slash).
4. Deploy and check `https://<your-service>.onrender.com/api/health`.
5. Optionally run `npm run seed` once from the Render shell or locally against the Atlas URI.

In production the cookie is `secure` with `sameSite: none` and `trust proxy` is enabled, as needed when frontend and backend are on different domains.

![Render screenshot placeholder](docs/render.png)

### 3. Frontend on Vercel
1. Import the repository, set **Root Directory** to `client`.
2. Framework preset Vite, build `npm run build`, output `dist`.
3. Add `VITE_API_URL=https://<your-service>.onrender.com/api`.
4. Deploy. `vercel.json` rewrites every route to `index.html` so refreshing any page works.

![Vercel screenshot placeholder](docs/vercel.png)

## Seeded accounts (local testing only)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@inkwell.com` | `Admin1234` |
| User | `jane@inkwell.com` | `Writer1234` |

Never seed or keep these credentials on a public deployment.
