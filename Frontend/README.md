<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5332c618-1966-4966-bb82-d2e0f7e5b642

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Supabase sign-in

The dashboard uses Google OAuth through Supabase. Configure the Google provider in
the Supabase Dashboard under **Authentication → Providers**, using a Google OAuth
client ID and secret. Set the Google OAuth authorized redirect URI to:

`https://xczcdzdowzoszigtvvdm.supabase.co/auth/v1/callback`

In **Authentication → URL Configuration**, set the production site URL to
`https://productiondashboard-five.vercel.app` and add these redirect URLs:

- `http://localhost:3000`
- `https://productiondashboard-five.vercel.app`

The tables remain protected by their existing `authenticated` SELECT policies.
Only signed-in users authorized by those policies can read their rows.
