![ViralClip Studio](public/paywall-test.png)

# ViralClip Studio

AI-powered SaaS for turning long-form content into viral, social-ready clips with subtitles, templates, and seamless paywalled access.

---

## ✨ Features

- **AI-assisted clip creation**: Turn longer videos into short, high-retention clips ready for TikTok, Reels, Shorts, and more.
- **Smart subtitles & layouts**: Auto-generate subtitles and use pre-built layouts, aspect ratios, and motion styles.
- **Template-driven workflows**: Save time with reusable templates for different channels, clients, and campaigns.
- **Monetization & paywalls**: Gate premium features and exports behind subscriptions and one-time purchases.
- **Subscription & billing**: Integrated with Square and Supabase for managing plans, variations, and active subscribers.

---

## 🧱 Tech stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express
- **Database & auth**: Supabase
- **Payments**: Square subscriptions & payments
- **Media processing**: FFmpeg-based video processing utilities

---

## 🚀 Getting started (local development)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the dev server**
   ```bash
   npm run dev
   ```

3. **Start the backend (optional if used separately)**
   ```bash
   npm run start
   ```

The app is powered by environment variables (Supabase, Square, etc.). Copy your example env file if available, or create one based on the values used in `supabase` and `server` config files.

---

## 🧪 Testing

Run the test suite with:

```bash
npm test
```

You can also use Playwright for end-to-end tests if configured:

```bash
npm run test:e2e
```

---

## 📄 License

This project is provided as-is for educational and internal use. Update this section with your preferred license before publishing publicly.

