# Platform Setup Guide

Step-by-step instructions for creating developer apps and connecting each advertising platform to the Social Ads Reporter.

---

## Prerequisites

Before configuring any platform, make sure:

1. You have the Google Sheets Add-On installed (see README.md)
2. You have the **OAuth2 library** added to your Apps Script project
3. You know your **OAuth Redirect URI** — displayed in the sidebar when you configure Meta, or get it by running `getRedirectUri()` in the Apps Script editor. It looks like:
   ```
   https://script.google.com/macros/d/{SCRIPT_ID}/usercallback
   ```

---

## 1. Meta (Facebook / Instagram) Ads

### Create a Meta App

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Click **Create App** and choose **Business** type
3. Enter an app name (e.g. "Sheets Ads Reporter") and select your Business portfolio
4. Once created, go to **App Settings > Basic** and copy the **App ID** and **App Secret**

### Add Products

5. In the left sidebar, click **Add Product**
6. Add **Facebook Login** — under Settings, add your OAuth Redirect URI to **Valid OAuth Redirect URIs**
7. Add **Marketing API** — no extra config needed

### Set Permissions

8. Go to **App Review > Permissions and Features**
9. Request `ads_read` and `read_insights` permissions (you can test in Development Mode first)

### Connect in the Sidebar

10. Open the sidebar, go to the **Meta** tab
11. Paste your **App ID** and **App Secret**, click **Save Credentials**
12. Click **Connect Meta Account** and authorize in the popup
13. Done — you should see a green "Connected" badge

### Notes
- Access tokens are auto-refreshed via the OAuth2 library
- For production use, submit your app for App Review to get permanent permissions
- API version: v21.0

---

## 2. TikTok Ads

### Create a TikTok App

1. Go to [business-api.tiktok.com/portal](https://business-api.tiktok.com/portal)
2. Click **My Apps > Create App**
3. Select **Marketing API** as the product
4. Fill in the app details and submit for review (usually approved within 1-2 business days)
5. Once approved, find your **App ID** and **App Secret** in the app dashboard

### Configure Permissions

6. In your app settings, enable the **Reporting** scope (read-only access to ad data)
7. Add your OAuth Redirect URI under **Redirect URIs** (if available)

### Connect in the Sidebar

8. Open the sidebar, switch to the **TikTok** tab
9. Paste your **App ID** and **App Secret**, click **Save Credentials**
10. Click **Connect TikTok** — a TikTok authorization page will open
11. Authorize your ad account(s)
12. After redirecting, **copy the `auth_code` from the URL** and paste it into the sidebar field
13. Click **Connect** to exchange the code for an access token

### Notes
- TikTok Marketing API access tokens **do not expire** (unless manually revoked)
- The auth_code paste step is needed because Google Sheets Add-On redirects may not work directly with TikTok's flow
- API version: v1.3
- Minimum quarterly ad spend may be required for API access

---

## 3. Snapchat Ads

### Create a Snap App

1. Go to [business.snapchat.com](https://business.snapchat.com)
2. Navigate to **Business Settings > Business Details**
3. Click **Developer Applications** in the left sidebar
4. Click **New App** and fill in the details
5. Copy the **Client ID** and **Client Secret**

### Apply for Marketing API Access

6. You must apply for Marketing API access: [businesshelp.snapchat.com](https://businesshelp.snapchat.com/s/article/api-apply)
7. Once approved, your app can access the `snapchat-marketing-api` scope

### Configure OAuth

8. In your app settings, add the OAuth Redirect URI to the **Redirect URIs** list:
   ```
   https://script.google.com/macros/d/{SCRIPT_ID}/usercallback
   ```

### Connect in the Sidebar

9. Open the sidebar, switch to the **Snapchat** tab
10. Paste your **Client ID** and **Client Secret**, click **Save Credentials**
11. Click **Connect Snapchat** and authorize in the popup
12. Done — the OAuth2 library handles token refresh automatically

### Notes
- Access tokens expire every **30 minutes** — the OAuth2 library auto-refreshes using the refresh token
- API base: `https://adsapi.snapchat.com/v1`
- Snapchat only allows **one dimension** per stats query (e.g. age OR country, not both)
- Some conversion metrics are not available with geographic/lifestyle dimensions

---

## 4. Reddit Ads

### Create a Reddit Developer Application

1. Go to [ads.reddit.com](https://ads.reddit.com) and sign in
2. In the left sidebar, find **Developer Applications** (under account or business settings)
3. Click **Create a new app**
4. Choose **Web app** type
5. Set the **redirect uri** to your OAuth Redirect URI:
   ```
   https://script.google.com/macros/d/{SCRIPT_ID}/usercallback
   ```
6. Copy the **Client ID** (shown below the app name) and the **Secret**

### Access Requirements

7. Reddit's Ads API v3 has removed whitelisting for basic access
8. For full access, you may need **$50,000+ quarterly ad spend** or contact a Reddit sales representative
9. Basic reporting access should work for smaller advertisers

### Connect in the Sidebar

10. Open the sidebar, switch to the **Reddit** tab
11. Paste your **Client ID** and **Client Secret**, click **Save Credentials**
12. Click **Connect Reddit** and authorize in the popup
13. Grant the `adsread` and `history` scopes

### Notes
- Refresh tokens are **permanent** until revoked
- The OAuth2 library handles token refresh automatically
- API base: `https://ads-api.reddit.com/api/v3`
- Reddit requires a `User-Agent` header (set automatically in the code)
- Breakdowns available: Country, Region, DMA, Community, Interest, Placement

---

## 5. Pinterest Ads

### Create a Pinterest App

1. Go to [developers.pinterest.com/apps](https://developers.pinterest.com/apps/)
2. Click **Create app**
3. Fill in the app name and description
4. Under **Redirect URIs**, add your OAuth Redirect URI:
   ```
   https://script.google.com/macros/d/{SCRIPT_ID}/usercallback
   ```
5. Copy the **App ID** and **App Secret**

### Request Ads Access

6. In your app settings, request access to the **Ads API**
7. You may need a Pinterest Business account with active ad campaigns
8. Pinterest may require approval for production access

### Important: TLS Requirement

9. Pinterest API v5 requires **TLS 1.2 or later** — Google Apps Script uses TLS 1.2+ by default, so this should work automatically

### Connect in the Sidebar

10. Open the sidebar, switch to the **Pinterest** tab
11. Paste your **App ID** and **App Secret**, click **Save Credentials**
12. Click **Connect Pinterest** and authorize in the popup
13. Grant the `ads:read` and `user_accounts:read` scopes

### Notes
- Pinterest uses **Basic authentication** (base64-encoded client_id:client_secret) for token exchange — this is handled automatically
- Access tokens expire and are auto-refreshed via the OAuth2 library
- API base: `https://api.pinterest.com/v5`
- Analytics are limited to **90 days** of historical data per request
- Pinterest uses UPPER_SNAKE_CASE for metric columns (e.g. `SPEND_IN_DOLLAR`, `PAID_IMPRESSION`)

---

## Troubleshooting

### "Not authenticated" error
- Make sure you saved your credentials in the sidebar
- Try disconnecting and reconnecting
- Check that your app hasn't been deactivated on the platform

### "Error loading accounts"
- Verify your API permissions/scopes include ad account read access
- Ensure you have at least one active ad account on the platform

### OAuth redirect not working
- Double-check that the redirect URI in your platform app settings matches exactly:
  ```
  https://script.google.com/macros/d/{SCRIPT_ID}/usercallback
  ```
- For TikTok, use the auth_code paste method instead

### Rate limits
- All platforms have API rate limits. If you hit them, wait a few minutes and try again
- Avoid running reports for all 5 platforms simultaneously

### Token refresh failures
- Snapchat, Reddit, and Pinterest tokens auto-refresh. If refresh fails, disconnect and reconnect
- TikTok tokens don't expire, but if revoked you'll need to re-authorize
- Meta tokens are managed by the OAuth2 library
