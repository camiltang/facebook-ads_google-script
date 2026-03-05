/**
 * SnapchatConfig.gs — Constants, API settings, and metrics/dimensions catalog
 * for Snapchat Ads reporting via the Snap Marketing API.
 */

// ── Snapchat API ────────────────────────────────────────────────────────────
var SNAP_API_BASE = 'https://adsapi.snapchat.com/v1';
var SNAP_AUTH_URL = 'https://accounts.snapchat.com/login/oauth2/authorize';
var SNAP_TOKEN_URL = 'https://accounts.snapchat.com/login/oauth2/access_token';
var SNAP_SCOPES = 'snapchat-marketing-api';

// ── Credentials ─────────────────────────────────────────────────────────────
function getSnapClientId()       { return PropertiesService.getUserProperties().getProperty('SNAP_CLIENT_ID')       || ''; }
function getSnapClientSecret()   { return PropertiesService.getUserProperties().getProperty('SNAP_CLIENT_SECRET')   || ''; }
function setSnapCredentials(clientId, clientSecret) {
  var props = PropertiesService.getUserProperties();
  props.setProperty('SNAP_CLIENT_ID', clientId);
  props.setProperty('SNAP_CLIENT_SECRET', clientSecret);
}

// ── Reporting levels ────────────────────────────────────────────────────────
var SNAP_DATA_LEVELS = [
  { value: 'adaccounts',  label: 'Ad Account' },
  { value: 'campaigns',   label: 'Campaign' },
  { value: 'adsquads',    label: 'Ad Squad' },
  { value: 'ads',         label: 'Ad' }
];

// ── Granularities ───────────────────────────────────────────────────────────
var SNAP_GRANULARITIES = [
  { value: 'DAY',      label: 'Daily' },
  { value: 'TOTAL',    label: 'Total' },
  { value: 'LIFETIME', label: 'Lifetime' }
];

// ── Report Dimensions (one at a time) ───────────────────────────────────────
var SNAP_DIMENSIONS = [
  { value: '',                     label: 'None',             category: 'None',         auto: false },
  { value: 'age',                  label: 'Age',              category: 'Demographics', auto: false },
  { value: 'gender',               label: 'Gender',           category: 'Demographics', auto: false },
  { value: 'age_gender',           label: 'Age + Gender',     category: 'Demographics', auto: false },
  { value: 'country',              label: 'Country',          category: 'Geography',    auto: false },
  { value: 'region',               label: 'Region',           category: 'Geography',    auto: false },
  { value: 'dma',                  label: 'DMA (US metro)',   category: 'Geography',    auto: false },
  { value: 'interest_category_id', label: 'Interest',         category: 'Targeting',    auto: false },
  { value: 'lifestyle_category',   label: 'Lifestyle',        category: 'Targeting',    auto: false },
  { value: 'device_make',          label: 'Device Make',      category: 'Device',       auto: false },
  { value: 'platform_os',          label: 'Platform OS',      category: 'Device',       auto: false }
];

// ── Metrics catalog ─────────────────────────────────────────────────────────
var SNAP_METRICS_CATALOG = [
  // ─ Delivery ─
  { value: 'impressions',           label: 'Impressions',           category: 'Delivery', type: 'metric' },
  { value: 'spend',                 label: 'Spend',                 category: 'Delivery', type: 'metric' },
  { value: 'frequency',             label: 'Frequency',             category: 'Delivery', type: 'metric' },
  { value: 'uniques',               label: 'Reach (Uniques)',       category: 'Delivery', type: 'metric' },

  // ─ Engagement ─
  { value: 'swipes',                label: 'Swipe Ups',             category: 'Engagement', type: 'metric' },
  { value: 'shares',                label: 'Shares',                category: 'Engagement', type: 'metric' },
  { value: 'saves',                 label: 'Saves',                 category: 'Engagement', type: 'metric' },
  { value: 'story_opens',           label: 'Story Opens',           category: 'Engagement', type: 'metric' },
  { value: 'story_completes',       label: 'Story Completes',       category: 'Engagement', type: 'metric' },
  { value: 'screen_time_millis',    label: 'Screen Time (ms)',      category: 'Engagement', type: 'metric' },
  { value: 'engaged_views',         label: 'Engaged Views',         category: 'Engagement', type: 'metric' },
  { value: 'landing_page_views',    label: 'Landing Page Views',    category: 'Engagement', type: 'metric' },

  // ─ Video ─
  { value: 'video_views',           label: 'Video Views (2s)',      category: 'Video', type: 'metric' },
  { value: 'video_views_5s',        label: 'Video Views (5s)',      category: 'Video', type: 'metric' },
  { value: 'quartile_1',            label: 'Video 25%',             category: 'Video', type: 'metric' },
  { value: 'quartile_2',            label: 'Video 50%',             category: 'Video', type: 'metric' },
  { value: 'quartile_3',            label: 'Video 75%',             category: 'Video', type: 'metric' },
  { value: 'view_completion',       label: 'Video 100%',            category: 'Video', type: 'metric' },
  { value: 'avg_screen_time_millis',label: 'Avg Screen Time (ms)',  category: 'Video', type: 'metric' },

  // ─ Attachment Video ─
  { value: 'attachment_video_views',     label: 'Attachment Video Views',  category: 'Attachment', type: 'metric' },
  { value: 'attachment_quartile_1',      label: 'Attachment 25%',          category: 'Attachment', type: 'metric' },
  { value: 'attachment_quartile_2',      label: 'Attachment 50%',          category: 'Attachment', type: 'metric' },
  { value: 'attachment_quartile_3',      label: 'Attachment 75%',          category: 'Attachment', type: 'metric' },
  { value: 'attachment_view_completion', label: 'Attachment 100%',         category: 'Attachment', type: 'metric' },

  // ─ App Installs ─
  { value: 'total_installs',        label: 'Total Installs',        category: 'Conversions', type: 'metric' },

  // ─ Conversions ─
  { value: 'conversion_purchases',        label: 'Purchases',              category: 'Conversions', type: 'metric' },
  { value: 'conversion_purchases_value',  label: 'Purchase Value',         category: 'Conversions', type: 'metric' },
  { value: 'conversion_add_cart',         label: 'Add to Cart',            category: 'Conversions', type: 'metric' },
  { value: 'conversion_start_checkout',   label: 'Start Checkout',         category: 'Conversions', type: 'metric' },
  { value: 'conversion_view_content',     label: 'View Content',           category: 'Conversions', type: 'metric' },
  { value: 'conversion_sign_ups',         label: 'Sign Ups',              category: 'Conversions', type: 'metric' },
  { value: 'conversion_searches',         label: 'Searches',              category: 'Conversions', type: 'metric' },
  { value: 'conversion_page_views',       label: 'Page Views',            category: 'Conversions', type: 'metric' },
  { value: 'conversion_save',             label: 'Conversion Save',       category: 'Conversions', type: 'metric' },
  { value: 'conversion_app_opens',        label: 'App Opens',             category: 'Conversions', type: 'metric' }
];

// ── Sidebar helpers ─────────────────────────────────────────────────────────
function getSnapMetricsCatalog()  { return JSON.stringify(SNAP_METRICS_CATALOG); }
function getSnapDimensions()      { return JSON.stringify(SNAP_DIMENSIONS); }
function getSnapDataLevels()      { return JSON.stringify(SNAP_DATA_LEVELS); }
function getSnapGranularities()   { return JSON.stringify(SNAP_GRANULARITIES); }
