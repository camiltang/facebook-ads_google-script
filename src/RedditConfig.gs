/**
 * RedditConfig.gs — Constants, API settings, and metrics/dimensions catalog
 * for Reddit Ads reporting via Reddit Ads API v3.
 */

// ── Reddit Ads API ──────────────────────────────────────────────────────────
var REDDIT_API_BASE  = 'https://ads-api.reddit.com/api/v3';
var REDDIT_AUTH_URL  = 'https://www.reddit.com/api/v1/authorize';
var REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
var REDDIT_SCOPES    = 'adsread,history';

// ── Credentials ─────────────────────────────────────────────────────────────
function getRedditClientId()     { return PropertiesService.getUserProperties().getProperty('REDDIT_CLIENT_ID')     || ''; }
function getRedditClientSecret() { return PropertiesService.getUserProperties().getProperty('REDDIT_CLIENT_SECRET') || ''; }
function setRedditCredentials(clientId, clientSecret) {
  var props = PropertiesService.getUserProperties();
  props.setProperty('REDDIT_CLIENT_ID', clientId);
  props.setProperty('REDDIT_CLIENT_SECRET', clientSecret);
}

// ── Reporting levels ────────────────────────────────────────────────────────
var REDDIT_DATA_LEVELS = [
  { value: 'account',  label: 'Account' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'adgroup',  label: 'Ad Group' },
  { value: 'ad',       label: 'Ad' }
];

// ── Granularities ───────────────────────────────────────────────────────────
var REDDIT_GRANULARITIES = [
  { value: 'DAY',   label: 'Daily' },
  { value: 'TOTAL', label: 'Total' }
];

// ── Breakdowns ──────────────────────────────────────────────────────────────
var REDDIT_DIMENSIONS = [
  { value: '',          label: 'None',        category: 'None',      auto: false },
  { value: 'country',   label: 'Country',     category: 'Geography', auto: false },
  { value: 'region',    label: 'Region',      category: 'Geography', auto: false },
  { value: 'dma',       label: 'DMA (US)',    category: 'Geography', auto: false },
  { value: 'community', label: 'Community',   category: 'Targeting', auto: false },
  { value: 'interest',  label: 'Interest',    category: 'Targeting', auto: false },
  { value: 'placement', label: 'Placement',   category: 'Delivery',  auto: false }
];

// ── Metrics catalog ─────────────────────────────────────────────────────────
var REDDIT_METRICS_CATALOG = [
  // ─ Delivery ─
  { value: 'impressions',                label: 'Impressions',              category: 'Delivery', type: 'metric' },
  { value: 'spend',                      label: 'Spend',                    category: 'Delivery', type: 'metric' },
  { value: 'clicks',                     label: 'Clicks',                   category: 'Delivery', type: 'metric' },
  { value: 'reach',                      label: 'Reach',                    category: 'Delivery', type: 'metric' },
  { value: 'viewable_impressions',       label: 'Viewable Impressions',     category: 'Delivery', type: 'metric' },

  // ─ Computed ─
  { value: 'ecpm',                       label: 'eCPM',                     category: 'Cost', type: 'metric' },
  { value: 'ctr',                        label: 'CTR',                      category: 'Cost', type: 'metric' },
  { value: 'cpc',                        label: 'CPC',                      category: 'Cost', type: 'metric' },

  // ─ Engagement ─
  { value: 'upvotes',                    label: 'Upvotes',                  category: 'Engagement', type: 'metric' },
  { value: 'downvotes',                  label: 'Downvotes',                category: 'Engagement', type: 'metric' },
  { value: 'comments',                   label: 'Comments',                 category: 'Engagement', type: 'metric' },
  { value: 'shares',                     label: 'Shares',                   category: 'Engagement', type: 'metric' },
  { value: 'follows',                    label: 'Follows',                  category: 'Engagement', type: 'metric' },

  // ─ Video ─
  { value: 'video_viewable_impressions', label: 'Video Viewable Impressions', category: 'Video', type: 'metric' },
  { value: 'video_fully_viewable_impressions', label: 'Video Fully Viewable', category: 'Video', type: 'metric' },
  { value: 'video_watched_25_percent',   label: 'Video 25%',               category: 'Video', type: 'metric' },
  { value: 'video_watched_50_percent',   label: 'Video 50%',               category: 'Video', type: 'metric' },
  { value: 'video_watched_75_percent',   label: 'Video 75%',               category: 'Video', type: 'metric' },
  { value: 'video_watched_100_percent',  label: 'Video 100%',              category: 'Video', type: 'metric' },
  { value: 'video_watched_3s',           label: 'Video 3s Views',          category: 'Video', type: 'metric' },

  // ─ Conversions (click-through) ─
  { value: 'conversion_purchase_clicks',       label: 'Purchases (Click)',        category: 'Conversions', type: 'metric' },
  { value: 'conversion_purchase_views',        label: 'Purchases (View)',         category: 'Conversions', type: 'metric' },
  { value: 'conversion_add_to_cart_clicks',    label: 'Add to Cart (Click)',      category: 'Conversions', type: 'metric' },
  { value: 'conversion_lead_clicks',           label: 'Leads (Click)',            category: 'Conversions', type: 'metric' },
  { value: 'conversion_sign_up_clicks',        label: 'Sign Ups (Click)',         category: 'Conversions', type: 'metric' },
  { value: 'conversion_page_visit_clicks',     label: 'Page Visits (Click)',      category: 'Conversions', type: 'metric' },
  { value: 'conversion_purchase_value_clicks', label: 'Purchase Value (Click)',   category: 'Conversions', type: 'metric' }
];

// ── Sidebar helpers ─────────────────────────────────────────────────────────
function getRedditMetricsCatalog()  { return JSON.stringify(REDDIT_METRICS_CATALOG); }
function getRedditDimensions()      { return JSON.stringify(REDDIT_DIMENSIONS); }
function getRedditDataLevels()      { return JSON.stringify(REDDIT_DATA_LEVELS); }
function getRedditGranularities()   { return JSON.stringify(REDDIT_GRANULARITIES); }
