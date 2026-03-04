# Social Ads Reporter — Google Sheets Add-On

A Google Sheets Add-On that pulls advertising data from social media platforms directly into your spreadsheet. Configure reports through a sidebar UI, run them on demand, or schedule recurring imports.

**Supported platforms:**
- **Meta Ads** (Facebook/Instagram) — Marketing API v21.0
- **TikTok Ads** — Business API v1.3
- **Snapchat Ads** — Marketing API v1
- **Reddit Ads** — Ads API v3
- **Pinterest Ads** — API v5

## Features

- **Sidebar UI** with step-by-step flow: authenticate, pick account, configure report, run
- **200+ metrics** across 5 platforms, organized by category (delivery, cost, clicks, video, engagement, conversions)
- **Metric presets** — Essential, Performance, or All with one click
- **Breakdowns/dimensions** — age, gender, country, device, platform, creative assets (varies by platform)
- **Custom date ranges** or presets (Meta supports last 7d, last 30d, etc.)
- **Formatted output** — new sheet per report with platform-colored headers, banding, filters, auto-resize
- **Scheduled reports** — daily, weekly, or monthly with two-step async (request + import 1h later)
- **5-platform tab navigation** — switch between platforms from the same sidebar

## Project Structure

```
├── appsscript.json                # Add-on manifest, OAuth scopes, library deps
├── src/
│   ├── Code.gs                    # Entry point, menu, sidebar launcher
│   ├── Config.gs                  # Meta: API constants, 50+ metrics catalog
│   ├── Auth.gs                    # Meta: OAuth2 via apps-script-oauth2
│   ├── MetaApi.gs                 # Meta: Marketing API calls
│   ├── ReportBuilder.gs           # Meta: report orchestration, action flattening
│   ├── TikTokConfig.gs            # TikTok: API constants, 40+ metrics catalog
│   ├── TikTokAuth.gs              # TikTok: custom auth_code exchange flow
│   ├── TikTokApi.gs               # TikTok: Business API calls
│   ├── TikTokReportBuilder.gs     # TikTok: report orchestration
│   ├── SnapchatConfig.gs          # Snapchat: API constants, 30+ metrics catalog
│   ├── SnapchatAuth.gs            # Snapchat: OAuth2 via apps-script-oauth2
│   ├── SnapchatApi.gs             # Snapchat: Marketing API calls
│   ├── SnapchatReportBuilder.gs   # Snapchat: report orchestration
│   ├── RedditConfig.gs            # Reddit: API constants, 25+ metrics catalog
│   ├── RedditAuth.gs              # Reddit: OAuth2 via apps-script-oauth2
│   ├── RedditApi.gs               # Reddit: Ads API v3 calls
│   ├── RedditReportBuilder.gs     # Reddit: report orchestration
│   ├── PinterestConfig.gs         # Pinterest: API constants, 30+ metrics catalog
│   ├── PinterestAuth.gs           # Pinterest: OAuth2 with Basic auth header
│   ├── PinterestApi.gs            # Pinterest: API v5 calls
│   ├── PinterestReportBuilder.gs  # Pinterest: report orchestration
│   ├── SheetWriter.gs             # Shared: sheet creation, per-platform formatting
│   └── Scheduler.gs               # Shared: trigger management for recurring reports
├── ui/
│   └── Sidebar.html               # Full sidebar UI (HTML/CSS/JS, 5-platform tabs)
├── archive/                       # Legacy scripts (pre-rewrite, Facebook API v5.0)
├── SETUP_GUIDE.md                 # Step-by-step setup for all 5 platforms
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

### 3. Configure Ad Platforms

See **[SETUP_GUIDE.md](SETUP_GUIDE.md)** for detailed step-by-step instructions for each platform:

- **Meta** — Create a Facebook App with Marketing API + Facebook Login products
- **TikTok** — Create a TikTok Business API app with Reporting scope
- **Snapchat** — Create a Snap Developer Application and apply for Marketing API access
- **Reddit** — Create a Reddit Developer Application at ads.reddit.com
- **Pinterest** — Create a Pinterest App and request Ads API access

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
