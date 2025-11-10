# 🏠 FamilySafe — Your Family's Digital Safe

> **Stop juggling passwords, digging through folders, and forgetting where you saved that important document. FamilySpace is your family's single, secure digital space for everything that matters.**

---

## 💡 The Problem We're Solving

How many times have you...
- 🤔 Forgotten which password goes with which account?
- 📁 Spent 20 minutes searching for an important document?
- 😰 Worried about sensitive family documents lying around?
- 🔐 Struggled to securely share important info with family?
- 📝 Kept passwords in notes or sticky notes (yikes!)?

**FamilySpace fixes all of this.** One place. Everything you need. Military-grade security you can trust.

---

## ✨ What You Can Do With FamilySpace

### 🔐 Your Personal Vault — Never Forget a Password Again

Stop remembering passwords. Start living.

- **Store anything:** Passwords, PINs, card details, ATM codes, WiFi keys
- **Never lose it:** Search and find what you need in seconds
- **Master password only:** Remember one password, access everything
- **Auto-wipe clipboard:** Your data disappears after 30 seconds
- **Organize by type:** PIN, Password, Card, ATM, or Custom

### 📄 All Your Documents in One Place

No more "Where did I save that PDF?"

- **Upload once, find anywhere:** Drop files and they're instantly accessible
- **View PDFs instantly:** No downloads needed—read right in your browser
- **Organize your life:** Insurance docs, deeds, contracts, receipts—all organized
- **Set expiry dates:** Documents automatically disappear when you want them to
- **Share securely:** Send documents to family with automatic expiry (e.g., 7 days)

### 👥 Built for Families, Not Just Individuals

Your family's information, securely.

- **Sign up in seconds:** Just your email, verified with a one-time code
- **Easy password reset:** No "answer security questions"—just verify via email
- **Activity tracking:** See which devices accessed your account
- **Peace of mind:** Know exactly who has what

---

## 🚀 Getting Started (5 Minutes)

### What You Need

- **Node.js** 18 or newer
- **npm** version 10+
- A Google account (for Firebase)
- A Gmail account (to send verification codes)

### Setup Steps

1. **Get the code**
   ```bash
   git clone https://github.com/nishil61/FamilySpace.git
   cd FamilySpace
   ```

2. **Install everything**
   ```bash
   npm install
   ```

3. **Set up your environment**
   
   Create a `.env.local` file with your Firebase details:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-key-here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   
   FIREBASE_ADMIN_SERVICE_ACCOUNT=your-admin-json-here
   
   EMAIL_SERVER_USER=your-gmail@gmail.com
   EMAIL_SERVER_PASSWORD=your-app-password
   EMAIL_FROM=your-gmail@gmail.com
   
   NEXT_PUBLIC_APP_URL=http://localhost:9002
   ```

   **Getting your Gmail app password:** Go to Google Account > Security > App Passwords (enable 2FA first)

4. **Set up Firebase rules**
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

5. **Run it**
   ```bash
   npm run dev
   ```
   
   Open http://localhost:9002 and you're ready!

### First Time Using It?

1. Sign up with your email
2. Enter the verification code (check your email)
3. Create a password for your Documents vault
4. Create a password for your Secure Vault
5. Start uploading documents or saving passwords!

---

## 🔒 Security (The Boring But Important Part)

**Your data is encrypted before it even leaves your device.** Here's how:

- **AES-256 encryption:** Military-grade, same encryption used by governments
- **Your encryption key:** Derived from your password using industry-standard PBKDF2 (100,000 iterations)
- **Zero-knowledge:** We literally can't see your data—only you can decrypt it
- **In transit:** HTTPS everywhere—snoops can't see your data traveling the internet
- **At rest:** Firebase encrypts everything on their servers anyway

**We take security seriously because your data should stay yours.**

---

## 📁 Project Layout

```
FamilySpace/
├── src/
│   ├── app/              # Pages and API routes
│   ├── components/       # Reusable React components
│   ├── context/          # State management
│   ├── hooks/            # Custom React helpers
│   ├── lib/              # Utility functions & Firebase setup
│   └── ai/               # AI features
├── firestore.rules       # Database security rules
├── storage.rules         # File storage security
├── next.config.ts        # Next.js configuration
└── package.json          # Dependencies
```

---

## 🛠️ Commands You'll Use

```bash
npm run dev          # Start development server (port 9002)
npm run build        # Build for production
npm run typecheck    # Check for TypeScript errors
npm start            # Run production build
```

---

## 🚀 Ready to Deploy?

### The Easiest Way: Vercel

Vercel was made for Next.js apps. Seriously, it's that easy.

1. Push your code to GitHub
2. Go to https://vercel.com and connect your repo
3. Add your environment variables
4. Deploy! That's it.

Vercel handles everything: HTTPS, CDN, scaling, backups. You focus on your family.

### Or, Use Firebase Hosting

```bash
firebase deploy
```

### Docker (For the Advanced)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🤔 Common Questions

**Q: Is my data really secure?**
A: Yes. Your data is encrypted on your device before we even see it. We literally cannot decrypt it—only you can with your password.

**Q: What if I forget my password?**
A: We can't reset it (because we can't access your encrypted data anyway). Instead, we verify you via email and let you create a new one. Your old encrypted data remains safe.

**Q: Can family members access each other's vaults?**
A: Each person has their own account and encryption password. Your wife can't see your passwords unless you share them (and you'd use the sharing feature).

**Q: What happens if FamilySpace shuts down?**
A: Your data stays on Firebase. You can request a data export anytime. It's your data—we just store it.

**Q: How much storage do I get?**
A: Depends on your Firebase plan. Start with 1GB free, upgrade anytime.

---

## 🎯 Built With Modern Tech

- **Next.js 15** — Fast, modern web framework
- **React 18** — Smooth, interactive UI
- **TypeScript** — Catches bugs before they happen
- **Tailwind CSS** — Beautiful, responsive design
- **Firebase** — Database, storage, authentication
- **AES-256** — Military-grade encryption

---

## 📋 What's Next?

- Mobile app coming soon (iPhone & Android)
- Document versioning (see old versions of documents)
- Advanced search across all your data
- Integration with password managers
- Two-device authentication for family sharing

---

## 🙋 Something Broken?

**Getting verification code?**
- Check your spam folder
- Make sure your Gmail app password is correct

**Can't upload a document?**
- File too big? Max is ~100MB
- Try refreshing the page

**Stuck somewhere?**
- Check your browser console for errors (F12)
- Create an issue on GitHub

---

## 📄 License

MIT License — Use it however you want. See LICENSE file for the legal stuff.

---

## ❤️ Made With Care

FamilySpace was built because families deserve better than sticky notes and forgotten passwords. Your family's important stuff deserves a secure home.

**Last updated:** November 9, 2025  
**Version:** 1.0.0 — Production Ready  
**Status:** ✅ Secure. Fast. Simple.

---

### One Last Thing

Your family trusts you with their important information. We trust you to keep this code secure. If you find security issues, please let us know privately before sharing publicly.

**You're building something that matters. Let's keep it safe.** 🏠


