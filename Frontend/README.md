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

## Supabase authentication

Google sign-in and workspace selection are handled by the Production System Hub.
When the user selects this dashboard, the Hub creates a short-lived, single-use
session handoff code. The dashboard consumes it and establishes a Supabase
session before requesting data. If opened without a session, the dashboard
returns the user to the Hub.

Deploy the handoff migration and Edge Functions from the Production System Hub
repository before deploying this frontend. The four production tables remain
protected by their existing `authenticated` SELECT policies.
