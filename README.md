# Social Ads Reporter — Google Sheets Add-On

A Google Sheets Add-On that pulls advertising data from social media platforms directly into your spreadsheet. Configure reports through a sidebar UI, run them on demand, or schedule recurring imports.

**Supported platforms:**
- **Meta Ads** (Facebook/Instagram) — via Marketing API v21.0
- **TikTok Ads** — via Business API v1.3
- Snapchat, Reddit, Pinterest — coming soon

## Features

- **Sidebar UI** with step-by-step flow: authenticate, pick account, configure report, run
- **50+ Meta metrics** and **40+ TikTok metrics** organized by category (delivery, cost, clicks, video, engagement, conversions)
- **Metric presets** — Essential, Performance, or All with one click
- **Breakdowns/dimensions** — age, gender, country, device, platform, creative assets
- **Custom date ranges** or presets (last 7d, last 30d, this month, etc.)
- **Formatted output** — new sheet per report with header styling, banding, filters, auto-resize
- **Scheduled reports** — daily, weekly, or monthly with two-step async (request + import 1h later)
- **Multi-platform tabs** — switch between Meta and TikTok from the same sidebar

## Project Structure

```
├── appsscript.json              # Add-on manifest, OAuth scopes, library deps
├── src/
│   ├── Code.gs                  # Entry point, menu, sidebar launcher
│   ├── Config.gs                # Meta API constants, metrics/breakdowns catalog
│   ├── Auth.gs                  # Meta OAuth2 (via apps-script-oauth2 library)
│   ├── MetaApi.gs               # Meta Marketing API calls (accounts, insights)
│   ├── ReportBuilder.gs         # Meta report orchestration, action flattening
│   ├── TikTokConfig.gs          # TikTok API constants, metrics/dimensions catalog
│   ├── TikTokAuth.gs            # TikTok OAuth (custom auth_code exchange flow)
│   ├── TikTokApi.gs             # TikTok Business API calls (advertisers, reports)
│   ├── TikTokReportBuilder.gs   # TikTok report orchestration, data flattening
│   ├── SheetWriter.gs           # Shared: sheet creation, formatting, data writing
│   └── Scheduler.gs             # Shared: trigger management for recurring reports
├── ui/
│   └── Sidebar.html             # Full sidebar UI (HTML/CSS/JS, multi-platform)
├── archive/                     # Legacy scripts (pre-rewrite, Facebook API v5.0)
└── README.md
```

## Setup

### 1. Create a Google Apps Script project

- Open a Google Sheet
- Go to **Extensions > Apps Script**
- Copy the files from `src/` and `ui/` into the project (or use [clasp](https://github.com/niconiahi/clasp) for local dev)
- Replace the default `appsscript.json` with the one from this repo

### 2. Add the OAuth2 library

In Apps Script, go to **Libraries** and add:
- Library ID: `1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF`
- Version: latest (43+)
- Identifier: `OAuth2`

### 3. Configure Meta Ads (optional)

1. Create a [Meta App](https://developers.facebook.com/apps/) with the **Marketing API** product
2. Add **Facebook Login** product and set the OAuth Redirect URI (shown in the sidebar)
3. Open the sidebar, enter your App ID and App Secret, and click **Connect Meta Account**

### 4. Configure TikTok Ads (optional)

1. Create a TikTok App at the [Business API Portal](https://business-api.tiktok.com/portal)
2. Add the **Reporting** permission scope
3. Open the sidebar, switch to the **TikTok Ads** tab, enter your App ID and Secret
4. Click **Connect**, authorize on TikTok, then paste the `auth_code` from the redirect URL

## Usage

1. Open the sidebar from **Add-ons > Social Ads Reporter > Open Sidebar**
2. Select a platform tab (Meta or TikTok)
3. **Step 1** — Connect your account
4. **Step 2** — Select an ad account / advertiser
5. **Step 3** — Choose reporting level, date range, metrics, and breakdowns
6. **Step 4** — Run the report (creates a new formatted sheet)
7. **Step 5** — Optionally schedule recurring reports

## Scheduling

Scheduled reports use two Google Apps Script time-based triggers:

- **Step A** runs at your chosen time — requests the report from the platform API
- **Step B** runs 1 hour later — imports the completed results into a new sheet

This handles the asynchronous nature of large report requests.

## Archive

The `archive/` folder contains the original scripts that predated this rewrite. They targeted Facebook API v5.0 and had no UI. Kept for reference only.

## License

MIT — see [LICENSE](LICENSE).
