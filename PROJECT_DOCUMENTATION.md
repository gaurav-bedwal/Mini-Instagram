# Blogs (Mini Instagram) - Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Architecture](#project-architecture)
4. [Installation & Setup](#installation--setup)
5. [Authentication System](#authentication-system)
6. [Database Models](#database-models)
7. [API Endpoints](#api-endpoints)
8. [Frontend Pages](#frontend-pages)
9. [File Upload System](#file-upload-system)
10. [Key Features](#key-features)
11. [Security Features](#security-features)
12. [Admin Panel](#admin-panel)

---

## 📖 Project Overview

**Blogs** is a full-stack social media application inspired by Instagram. It allows users to share photos, follow other users, interact with posts through likes and comments, share stories, and communicate via direct messages.

### Core Functionality:
- 📸 Photo sharing with captions and hashtags
- 👥 User profiles with followers/following
- 💬 Comments and likes on posts
- 📨 Direct messaging between users
- 📱 Stories that expire after 24 hours
- 🔔 Real-time notifications
- 🔒 Private accounts and user blocking
- 👨‍💼 Admin dashboard for content moderation

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Node.js | ≥18.0.0 | JavaScript runtime |
| **Framework** | Express.js | 5.2.1 | Web server framework |
| **Database** | MongoDB | - | NoSQL database |
| **ODM** | Mongoose | 9.2.1 | MongoDB object modeling |
| **Template Engine** | EJS | 4.0.1 | Server-side rendering |
| **Authentication** | JWT | 9.0.3 | Token-based auth |
| **Password Hashing** | bcryptjs | 3.0.3 | Secure password storage |
| **File Upload** | Multer | 2.0.2 | Multipart form handling |
| **Cloud Storage** | Cloudinary | 2.9.0 | Image storage & CDN |
| **Security** | Helmet | 8.1.0 | HTTP security headers |
| **Rate Limiting** | express-rate-limit | 8.2.1 | DDoS protection |
| **Validation** | express-validator | 7.3.1 | Input validation |
| **Session** | express-session | - | Session management |
| **Flash Messages** | connect-flash | - | User feedback |

---

## 🏗️ Project Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                          │
│                    HTML/CSS/JavaScript (EJS Templates)              │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTP Requests
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         EXPRESS SERVER                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     MIDDLEWARE STACK                         │   │
│  │  • helmet() - Security headers                               │   │
│  │  • express.json() - JSON parsing                             │   │
│  │  • cookieParser() - Cookie handling                          │   │
│  │  • express-session - Session management                       │   │
│  │  • authMiddleware - JWT verification                         │   │
│  │  • rateLimiter - Request throttling                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                 │                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        ROUTERS                               │   │
│  │  • authRouter.js    - Authentication & user management      │   │
│  │  • postRouter.js    - Posts, comments, likes                │   │
│  │  • storyRouter.js   - Stories & highlights                  │   │
│  │  • messageRouter.js - Direct messaging                      │   │
│  │  • notificationRouter.js - Notifications                    │   │
│  │  • reportRouter.js  - Content reporting                     │   │
│  │  • adminRouter.js   - Admin dashboard                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                     │
│  ┌───────────────────┐    ┌────────────────────┐                   │
│  │   MONGOOSE ODM    │    │     CLOUDINARY     │                   │
│  │   (11 Models)     │    │   (Image Storage)  │                   │
│  └─────────┬─────────┘    └────────────────────┘                   │
│            │                                                        │
│            ▼                                                        │
│  ┌───────────────────┐                                             │
│  │   MONGODB ATLAS   │                                             │
│  │   (Cloud Database)│                                             │
│  └───────────────────┘                                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Directory Structure:

```
mini-insta/
├── server.js              # Main entry point
├── package.json           # Dependencies & scripts
├── seed.js                # Database seeding script
│
├── middleware/            # Express middleware
│   ├── auth.js            # JWT authentication
│   ├── admin.js           # Admin role checking
│   └── validators.js      # Input validation rules
│
├── models/                # Mongoose schemas
│   ├── User.js            # User accounts
│   ├── Post.js            # Photo posts
│   ├── Story.js           # Temporary stories
│   ├── Message.js         # Direct messages
│   ├── Notification.js    # User notifications
│   ├── Report.js          # Content reports
│   ├── VerificationRequest.js  # Blue badge requests
│   ├── Announcement.js    # System announcements
│   ├── Appeal.js          # Ban appeals
│   ├── AuditLog.js        # Admin action logs
│   └── Highlight.js       # Story highlights
│
├── router/                # API routes
│   ├── authRouter.js      # Auth & user routes
│   ├── postRouter.js      # Post routes
│   ├── storyRouter.js     # Story routes
│   ├── messageRouter.js   # DM routes
│   ├── notificationRouter.js  # Notification routes
│   ├── reportRouter.js    # Report routes
│   └── adminRouter.js     # Admin routes
│
├── utils/                 # Utility functions
│   └── cloudinary.js      # Image upload helper
│
└── views/                 # EJS templates
    ├── index.ejs          # Home feed
    ├── login.ejs          # Login page
    ├── register.ejs       # Registration
    ├── profile.ejs        # User profile
    ├── settings.ejs       # Account settings
    ├── explore.ejs        # Discover content
    ├── *.ejs              # Other pages...
    ├── partials/          # Reusable components
    │   ├── sidebar.ejs
    │   ├── top-nav.ejs
    │   ├── mobile-nav.ejs
    │   ├── modal.ejs
    │   ├── scripts.ejs
    │   └── common-styles.ejs
    ├── admin/             # Admin pages
    └── messages/          # DM pages
```

---

## 🚀 Installation & Setup

### Prerequisites:
- Node.js ≥ 18.0.0
- MongoDB Atlas account or local MongoDB
- Cloudinary account

### Steps:

```bash
# 1. Clone the repository
git clone <repository-url>
cd mini-insta

# 2. Install dependencies
npm install

# 3. Create environment variables
# Create a .env file with:
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/blogs
JWT_SECRET=your-super-secret-jwt-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SESSION_SECRET=your-session-secret

# 4. Seed the database (optional)
npm run seed

# 5. Start the server
npm start
# Or for development
npm run dev
```

### NPM Scripts:
```json
{
  "start": "node server.js",
  "dev": "nodemon server.js",
  "seed": "node seed.js"
}
```

---

## 🔐 Authentication System

### JWT (JSON Web Token) Flow:

```
┌──────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                             │
└──────────────────────────────────────────────────────────────────────┘

1. REGISTRATION
   ┌────────┐     POST /register      ┌────────┐
   │ Client │ ─────────────────────▶ │ Server │
   │        │  {username, password,   │        │
   │        │   email, avatar}        │        │
   └────────┘                         └───┬────┘
                                          │
                              ┌───────────▼───────────┐
                              │  1. Validate input    │
                              │  2. Hash password     │
                              │  3. Upload avatar     │
                              │  4. Save to MongoDB   │
                              │  5. Generate JWT      │
                              │  6. Set cookie        │
                              └───────────────────────┘

2. LOGIN
   ┌────────┐    POST /login          ┌────────┐
   │ Client │ ─────────────────────▶ │ Server │
   │        │  {username, password}   │        │
   └────────┘                         └───┬────┘
                                          │
                              ┌───────────▼───────────┐
                              │  1. Find user in DB   │
                              │  2. Compare password  │
                              │  3. Generate JWT      │
                              │  4. Record login      │
                              │  5. Set HTTP-only     │
                              │     cookie            │
                              └───────────────────────┘

3. PROTECTED ROUTES
   ┌────────┐   GET /protected        ┌────────┐
   │ Client │ ─────────────────────▶ │ Server │
   │  🍪    │   Cookie: token=xyz     │        │
   └────────┘                         └───┬────┘
                                          │
                              ┌───────────▼───────────┐
                              │  auth.js middleware   │
                              │  1. Extract token     │
                              │  2. jwt.verify()      │
                              │  3. Load user from DB │
                              │  4. Attach req.user   │
                              │  5. next()            │
                              └───────────────────────┘
```

### JWT Configuration:

```javascript
const token = jwt.sign(
  { id: user._id },           // Payload
  process.env.JWT_SECRET,     // Secret key
  { expiresIn: '7d' }         // Expiration
);

res.cookie('token', token, {
  httpOnly: true,             // Prevents XSS attacks
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',            // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});
```

### Auth Middleware (auth.js):

```javascript
const auth = async (req, res, next) => {
  try {
    // 1. Get token from cookie
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');
    
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Find user and attach to request
    const user = await User.findById(decoded.id);
    if (!user || user.isBanned) return res.redirect('/login');
    
    req.user = user;
    next();
  } catch (err) {
    res.redirect('/login');
  }
};
```

### Password Reset Flow:

```
User requests reset → Server generates random token → 
Token hashed with SHA256 → Stored in DB with 1-hour expiry → 
User clicks reset link → Token verified → Password updated
```

---

## 📊 Database Models

### 1. User Model

```javascript
const userSchema = new mongoose.Schema({
  // Credentials
  username: { type: String, required: true, unique: true, lowercase: true },
  email: { type: String },
  password: { type: String, required: true },  // Bcrypt hashed
  
  // Profile
  name: { type: String },
  avatar: { type: String },  // Cloudinary URL
  bio: { type: String, maxLength: 150 },
  website: { type: String },
  
  // Social Links
  socialLinks: {
    instagram: String,
    twitter: String,
    youtube: String
  },
  
  // Role & Status
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  isVerified: { type: Boolean, default: false },    // Blue checkmark
  isPrivate: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  isShadowBanned: { type: Boolean, default: false },
  banReason: { type: String },
  
  // Relationships
  followers: [{ type: ObjectId, ref: 'User' }],
  following: [{ type: ObjectId, ref: 'User' }],
  blockedUsers: [{ type: ObjectId, ref: 'User' }],
  closeFriends: [{ type: ObjectId, ref: 'User' }],
  followRequests: [{ type: ObjectId, ref: 'User' }],
  
  // Content
  savedPosts: [{ type: ObjectId, ref: 'Post' }],
  
  // Settings
  notificationSettings: {
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    follows: { type: Boolean, default: true },
    messages: { type: Boolean, default: true }
  },
  
  // Security
  loginHistory: [{
    ip: String,
    device: String,
    loginTime: Date
  }],
  
  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });
```

### 2. Post Model

```javascript
const postSchema = new mongoose.Schema({
  user: { type: ObjectId, ref: 'User', required: true },
  
  // Content
  image: { type: String, required: true },
  caption: { type: String, maxLength: 2200 },
  title: { type: String },
  
  // Engagement
  likes: [{ type: ObjectId, ref: 'User' }],
  comments: [{
    user: { type: ObjectId, ref: 'User' },
    username: String,
    avatar: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Metadata
  hashtags: [{ type: String }],  // Auto-extracted
  location: { type: String },
  
  // Status
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

postSchema.pre('save', function(next) {
  if (this.caption) {
    const hashtagRegex = /#(\w+)/g;
    const matches = this.caption.match(hashtagRegex);
    this.hashtags = matches ? matches.map(h => h.toLowerCase()) : [];
  }
  next();
});
```

### 3. Story Model

```javascript
const storySchema = new mongoose.Schema({
  user: { type: ObjectId, ref: 'User', required: true },
  
  // Media
  media: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  caption: { type: String, maxLength: 500 },
  
  // Interactive Elements
  stickers: [{
    type: { type: String, enum: ['text', 'mention', 'hashtag', 'location', 'emoji'] },
    content: String,
    position: { x: Number, y: Number }
  }],
  
  // Poll
  poll: {
    question: String,
    options: [{ text: String, votes: [{ type: ObjectId, ref: 'User' }] }]
  },
  
  // Question sticker
  questionSticker: {
    question: String,
    responses: [{ user: { type: ObjectId, ref: 'User' }, response: String }]
  },
  
  // Engagement
  views: [{
    user: { type: ObjectId, ref: 'User' },
    viewedAt: { type: Date, default: Date.now }
  }],
  reactions: [{
    user: { type: ObjectId, ref: 'User' },
    emoji: String
  }],
  
  // Privacy
  closeFriendsOnly: { type: Boolean, default: false },
  
  // Expiration
  expiresAt: { type: Date, default: () => Date.now() + 24*60*60*1000 },
  isHighlight: { type: Boolean, default: false }
}, { timestamps: true });

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

### 4. Message Model

```javascript
const messageSchema = new mongoose.Schema({
  participants: [{ type: ObjectId, ref: 'User' }],
  
  messages: [{
    sender: { type: ObjectId, ref: 'User' },
    content: String,
    type: { type: String, enum: ['text', 'image', 'emoji'], default: 'text' },
    readBy: [{ type: ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Preview for inbox
  lastMessage: {
    content: String,
    sender: { type: ObjectId, ref: 'User' },
    createdAt: Date
  },
  
  // Group chat
  isGroupChat: { type: Boolean, default: false },
  groupName: String,
  groupAvatar: String
}, { timestamps: true });
```

### 5. Notification Model

```javascript
const notificationSchema = new mongoose.Schema({
  recipient: { type: ObjectId, ref: 'User', required: true },
  sender: { type: ObjectId, ref: 'User' },
  
  type: { 
    type: String, 
    enum: ['like', 'comment', 'follow', 'follow_request', 'message', 
           'mention', 'story_reaction', 'system'],
    required: true 
  },
  
  // Related content
  post: { type: ObjectId, ref: 'Post' },
  story: { type: ObjectId, ref: 'Story' },
  message: { type: String },
  link: { type: String },
  
  // Status
  isRead: { type: Boolean, default: false }
}, { timestamps: true });
```

### 6. Report Model

```javascript
const reportSchema = new mongoose.Schema({
  reporter: { type: ObjectId, ref: 'User', required: true },
  
  reportType: { 
    type: String, 
    enum: ['post', 'comment', 'user', 'message', 'story'],
    required: true 
  },
  
  // Target (one of these)
  reportedPost: { type: ObjectId, ref: 'Post' },
  reportedUser: { type: ObjectId, ref: 'User' },
  reportedComment: { postId: ObjectId, commentText: String },
  reportedStory: { type: ObjectId, ref: 'Story' },
  
  reason: { 
    type: String, 
    enum: ['spam', 'harassment', 'hate_speech', 'nudity', 'violence', 
           'scam', 'false_information', 'intellectual_property', 'other'],
    required: true 
  },
  
  additionalInfo: { type: String, maxLength: 1000 },
  
  status: { 
    type: String, 
    enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    default: 'pending'
  },
  
  // Admin action
  reviewedBy: { type: ObjectId, ref: 'User' },
  actionTaken: { 
    type: String, 
    enum: ['none', 'warning', 'content_removed', 'user_banned']
  },
  adminNotes: String
}, { timestamps: true });
```

### 7. VerificationRequest Model

```javascript
const verificationRequestSchema = new mongoose.Schema({
  user: { type: ObjectId, ref: 'User', required: true },
  
  // Application info
  fullName: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['creator', 'business', 'government', 'media', 'entertainment', 'sports', 'other'],
    required: true 
  },
  reason: { type: String, required: true },
  links: [{ type: String }],  // Supporting URLs
  idDocument: { type: String },  // Cloudinary URL
  
  // Review
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  adminNotes: { type: String },
  rejectionReason: { type: String }
}, { timestamps: true });
```

---

## 🔌 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/register` | Registration page | ❌ |
| `POST` | `/register` | Create new account | ❌ |
| `GET` | `/login` | Login page | ❌ |
| `POST` | `/login` | Authenticate user | ❌ |
| `GET` | `/logout` | Clear session & redirect | ✅ |
| `GET` | `/forgot-password` | Password reset request page | ❌ |
| `POST` | `/forgot-password` | Send reset token | ❌ |
| `GET` | `/reset-password/:token` | Reset password form | ❌ |
| `POST` | `/reset-password/:token` | Update password | ❌ |

### User Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/user/:id` | View user profile | ✅ |
| `GET` | `/user/:id/followers` | Followers list | ✅ |
| `GET` | `/user/:id/following` | Following list | ✅ |
| `POST` | `/user/:id/follow` | Toggle follow | ✅ |
| `POST` | `/user/:id/block` | Block user | ✅ |
| `POST` | `/user/:id/unblock` | Unblock user | ✅ |
| `GET` | `/search` | Search users | ✅ |
| `GET` | `/search/all` | Search users, posts, hashtags | ✅ |
| `GET` | `/suggested` | Suggested users | ✅ |
| `GET` | `/activity` | Login history | ✅ |

### Settings Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/settings` | Settings page | ✅ |
| `POST` | `/settings` | Update profile | ✅ |
| `POST` | `/settings/privacy` | Update privacy settings | ✅ |
| `POST` | `/settings/notifications` | Update notification prefs | ✅ |
| `POST` | `/settings/password` | Change password | ✅ |
| `POST` | `/settings/delete-account` | Delete account | ✅ |

### Post Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | Home feed | ✅ |
| `GET` | `/api/posts` | Posts API (paginated) | ✅ |
| `GET` | `/explore` | Explore page | ✅ |
| `GET` | `/hashtag/:tag` | Posts by hashtag | ✅ |
| `GET` | `/post/new` | New post form | ✅ |
| `POST` | `/post` | Create post | ✅ |
| `GET` | `/post/:id` | View single post | ✅ |
| `GET` | `/post/:id/edit` | Edit post form | ✅ |
| `POST` | `/post/:id/edit` | Update post | ✅ |
| `POST` | `/post/:id/delete` | Delete post | ✅ |
| `POST` | `/post/:id/like` | Toggle like | ✅ |
| `POST` | `/post/:id/comment` | Add comment | ✅ |
| `POST` | `/post/:id/save` | Toggle bookmark | ✅ |
| `GET` | `/saved` | Saved posts | ✅ |

### Story Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/stories` | Stories feed | ✅ |
| `GET` | `/stories/new` | New story form | ✅ |
| `POST` | `/stories` | Create story | ✅ |
| `GET` | `/stories/:id` | View story | ✅ |
| `DELETE` | `/stories/:id` | Delete story | ✅ |
| `POST` | `/stories/:id/react` | React to story | ✅ |
| `POST` | `/stories/:id/poll/:optionIndex` | Vote on poll | ✅ |
| `POST` | `/stories/:id/question` | Answer question | ✅ |
| `GET` | `/stories/:id/viewers` | Story viewers | ✅ |
| `POST` | `/stories/:id/highlight` | Add to highlight | ✅ |
| `GET` | `/stories/highlights/:userId` | User highlights | ✅ |

### Message Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/messages` | Inbox | ✅ |
| `GET` | `/messages/conversation/:userId` | Get/create conversation | ✅ |
| `POST` | `/messages/send/:conversationId` | Send message | ✅ |
| `DELETE` | `/messages/message/:conversationId/:messageIndex` | Delete message | ✅ |
| `DELETE` | `/messages/conversation/:id` | Delete conversation | ✅ |

### Notification Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/notifications` | All notifications | ✅ |
| `GET` | `/notifications/unread-count` | Unread count | ✅ |
| `POST` | `/notifications/read/:id` | Mark as read | ✅ |
| `POST` | `/notifications/read-all` | Mark all as read | ✅ |
| `DELETE` | `/notifications/:id` | Delete notification | ✅ |
| `DELETE` | `/notifications/clear/all` | Clear all | ✅ |

### Report Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/reports/post/:postId` | Report a post | ✅ |
| `POST` | `/reports/user/:userId` | Report a user | ✅ |
| `POST` | `/reports/comment/:postId` | Report a comment | ✅ |
| `GET` | `/reports/my-reports` | User's reports | ✅ |

### Verification Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/verify/request` | Verification request form | ✅ |
| `POST` | `/verify/request` | Submit verification request | ✅ |

### Admin Routes (Admin/Moderator Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin` | Admin dashboard |
| `GET` | `/admin/users` | User management |
| `GET` | `/admin/posts` | Post management |
| `GET` | `/admin/analytics` | Analytics |
| `GET` | `/admin/verifications` | Verification requests |
| `GET` | `/reports/admin/all` | All reports |
| `POST` | `/admin/user/:id/ban` | Ban/unban user |
| `POST` | `/admin/user/:id/verify` | Grant/revoke verification |
| `POST` | `/admin/user/:id/role` | Change user role |
| `DELETE` | `/admin/user/:id` | Delete user |
| `DELETE` | `/admin/post/:id` | Delete post |
| `POST` | `/admin/post/:id/archive` | Archive/restore post |
| `POST` | `/reports/admin/:id/review` | Review report |
| `POST` | `/admin/verification/:id/review` | Review verification request |

---

## 🖥️ Frontend Pages

### Public Pages
| Page | File | Route | Description |
|------|------|-------|-------------|
| Login | `login.ejs` | `/login` | User authentication |
| Register | `register.ejs` | `/register` | Account creation |
| Forgot Password | `forgot-password.ejs` | `/forgot-password` | Reset request |
| Reset Password | `reset-password.ejs` | `/reset-password/:token` | Set new password |

### User Pages
| Page | File | Route | Description |
|------|------|-------|-------------|
| Home Feed | `index.ejs` | `/` | Main feed with posts |
| Profile | `profile.ejs` | `/user/:id` | User profile with post grid |
| Settings | `settings.ejs` | `/settings` | Account settings (tabs) |
| Followers | `followers.ejs` | `/user/:id/followers` | Followers/following list |
| Search | `search.ejs` | `/search` | User search |
| Suggested | `suggested.ejs` | `/suggested` | Suggested users |
| Activity | `activity.ejs` | `/activity` | Login history |
| Verify Request | `verify-request.ejs` | `/verify/request` | Verification form |

### Content Pages
| Page | File | Route | Description |
|------|------|-------|-------------|
| New Post | `newpost.ejs` | `/post/new` | Create post |
| Edit Post | `editpost.ejs` | `/post/:id/edit` | Edit post |
| View Post | `viewpost.ejs` | `/post/:id` | Single post view |
| Saved Posts | `saved.ejs` | `/saved` | Bookmarked posts |
| Explore | `explore.ejs` | `/explore` | Discover content |
| Hashtag | `hashtag.ejs` | `/hashtag/:tag` | Posts by hashtag |

### Story Pages
| Page | File | Route | Description |
|------|------|-------|-------------|
| Stories Feed | `stories/feed.ejs` | `/stories` | Stories carousel |
| New Story | `stories/new.ejs` | `/stories/new` | Create story |
| View Story | `stories/view.ejs` | `/stories/:id` | Story viewer |

### Messaging Pages
| Page | File | Route | Description |
|------|------|-------|-------------|
| Inbox | `messages/inbox.ejs` | `/messages` | Conversations list |
| Chat | `messages/conversation.ejs` | `/messages/conversation/:id` | Chat view |

### Admin Pages
| Page | File | Route | Description |
|------|------|-------|-------------|
| Dashboard | `admin/dashboard.ejs` | `/admin` | Overview & stats |
| Users | `admin/users.ejs` | `/admin/users` | User management |
| Posts | `admin/posts.ejs` | `/admin/posts` | Post management |
| Reports | `admin/reports.ejs` | `/reports/admin/all` | Report management |
| Analytics | `admin/analytics.ejs` | `/admin/analytics` | Charts & graphs |
| Verifications | `admin/verifications.ejs` | `/admin/verifications` | Badge requests |

### Shared Partials
| Partial | File | Description |
|---------|------|-------------|
| Common Styles | `partials/common-styles.ejs` | CSS variables, base styles |
| Sidebar | `partials/sidebar.ejs` | Navigation sidebar |
| Top Nav | `partials/top-nav.ejs` | Top navigation bar |
| Mobile Nav | `partials/mobile-nav.ejs` | Bottom mobile navigation |
| Modal | `partials/modal.ejs` | Post creation modal |
| Scripts | `partials/scripts.ejs` | Common JavaScript |

---

## 📤 File Upload System

### Architecture:

```
┌─────────────┐     multipart/form-data     ┌──────────────┐
│   Browser   │ ─────────────────────────▶ │    Express   │
│  (Form)     │                             │   (Multer)   │
└─────────────┘                             └──────┬───────┘
                                                   │
                                           Buffer in memory
                                                   │
                                                   ▼
                                           ┌──────────────┐
                                           │  uploadImage │
                                           │  (cloudinary)│
                                           └──────┬───────┘
                                                  │
                                                  ▼
                                           ┌──────────────┐
                                           │  Cloudinary  │
                                           │    CDN       │
                                           └──────┬───────┘
                                                  │
                                           Returns secure_url
                                                  │
                                                  ▼
                                           ┌──────────────┐
                                           │   MongoDB    │
                                           │ (store URL)  │
                                           └──────────────┘
```

### Implementation:

```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImage = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'mini-insta' },
      (error, result) => {
        if (error) reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = { uploadImage, cloudinary };
```

### Usage in Routes:

```javascript
const multer = require('multer');
const { uploadImage } = require('../utils/cloudinary');

const upload = multer();  // Store in memory

router.post('/post', auth, upload.single('image'), async (req, res) => {
  // Upload to Cloudinary
  const result = await uploadImage(req.file.buffer);
  
  // Save URL to MongoDB
  const post = new Post({
    user: req.user._id,
    image: result.secure_url,
    caption: req.body.caption
  });
  await post.save();
});
```

### Supported Uploads:
- **Avatars**: User profile pictures
- **Posts**: Photo posts
- **Stories**: Story images/videos
- **ID Documents**: Verification requests

---

## ⭐ Key Features

### 👤 User Management
- ✅ User registration with avatar upload
- ✅ Login with password hashing (bcrypt)
- ✅ JWT-based authentication
- ✅ Profile customization (bio, website, social links)
- ✅ Private/public account toggle
- ✅ Follow/unfollow users
- ✅ Block/unblock users
- ✅ Close friends list
- ✅ Password reset via token
- ✅ Account deletion
- ✅ Login history tracking
- ✅ Blue badge verification requests

### 📸 Content Features
- ✅ Photo posts with captions
- ✅ Auto hashtag extraction from captions
- ✅ Like/unlike posts
- ✅ Comments on posts
- ✅ Post bookmarking (save)
- ✅ Post editing and deletion
- ✅ Post archiving
- ✅ Explore page with trending hashtags
- ✅ Hashtag pages
- ✅ Suggested users algorithm

### 📱 Stories
- ✅ 24-hour expiring stories (TTL index)
- ✅ Interactive stickers (text, mentions, polls, questions)
- ✅ Story reactions with emojis
- ✅ Poll voting
- ✅ Question sticker responses
- ✅ Close friends only stories
- ✅ Story highlights (permanent collections)
- ✅ View tracking

### 💬 Messaging
- ✅ Direct messages (1-on-1)
- ✅ Conversation inbox
- ✅ Message read receipts
- ✅ Message deletion

### 🔔 Notifications
- ✅ Like notifications
- ✅ Comment notifications
- ✅ Follow notifications
- ✅ Message notifications
- ✅ Story reaction notifications
- ✅ Notification preferences (per-type toggle)
- ✅ Mark as read / Mark all read
- ✅ Delete notifications

### 🚨 Reporting & Moderation
- ✅ Report posts, users, comments, stories
- ✅ Multiple report reasons
- ✅ Report status tracking
- ✅ Admin report review
- ✅ Action taken logging

---

## 🔒 Security Features

| Feature | Implementation |
|---------|----------------|
| **Password Hashing** | bcryptjs with 12 salt rounds |
| **JWT Tokens** | HTTP-only cookies, 7-day expiry |
| **HTTPS Headers** | Helmet.js middleware |
| **Rate Limiting** | 100 requests per 15 minutes |
| **Input Validation** | express-validator |
| **CSRF Protection** | sameSite cookie flag |
| **XSS Prevention** | HTTP-only cookies, EJS escaping |
| **Account Banning** | Admin can ban/shadow-ban users |
| **Login Tracking** | IP and device logging |
| **Password Reset** | SHA256 hashed tokens, 1-hour expiry |

### Rate Limiting Configuration:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests, please try again later.'
});

app.use(limiter);
```

---

## 👨‍💼 Admin Panel

### Dashboard Overview
- Total users, posts, likes, comments
- New users/posts this week
- Top users by followers
- Posts per day chart
- Recent users and posts

### User Management
- Search and filter users
- View user details
- Ban/unban users
- Grant/revoke admin roles
- Verify/unverify users
- Delete users

### Post Management
- Search and filter posts
- View post details
- Archive/restore posts
- Delete posts

### Report Management
- View all reports (filtered by status)
- Review reports
- Take action (warn, remove content, ban user)
- Add admin notes

### Verification Requests
- View pending requests
- Review supporting documents
- Approve/reject with reason
- Send notification to user

### Analytics
- User registration trends
- Post creation trends
- Engagement metrics
- Time-based filtering (7/30/90 days)

---

## 📝 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/blogs

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-session-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional: Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🎨 Frontend Styling

### CSS Variables (Dark/Light Theme):

```css
:root {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #fafafa;
  --color-text-primary: #262626;
  --color-text-secondary: #8e8e8e;
  --color-border: #dbdbdb;
  --color-primary: #0095f6;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

body.dark-mode {
  --color-bg-primary: #000000;
  --color-bg-secondary: #121212;
  --color-text-primary: #f5f5f5;
  --color-text-secondary: #a8a8a8;
  --color-border: #363636;
}
```

### Theme Toggle:

```javascript
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
}
```

---

## 📄 License

This project is for educational purposes.

---

*Documentation generated on February 27, 2026*
