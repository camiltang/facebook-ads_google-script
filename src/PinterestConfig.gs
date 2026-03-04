/**
 * PinterestConfig.gs — Constants, API settings, and metrics/dimensions catalog
 * for Pinterest Ads reporting via Pinterest API v5.
 */

// ── Pinterest API ───────────────────────────────────────────────────────────
var PINTEREST_API_BASE  = 'https://api.pinterest.com/v5';
var PINTEREST_AUTH_URL  = 'https://www.pinterest.com/oauth/';
var PINTEREST_TOKEN_URL = 'https://api.pinterest.com/v5/oauth/token';
var PINTEREST_SCOPES    = 'ads:read,user_accounts:read';

// ── Credentials ─────────────────────────────────────────────────────────────
function getPinterestClientId()     { return PropertiesService.getUserProperties().getProperty('PINTEREST_CLIENT_ID')     || ''; }
function getPinterestClientSecret() { return PropertiesService.getUserProperties().getProperty('PINTEREST_CLIENT_SECRET') || ''; }
function setPinterestCredentials(clientId, clientSecret) {
  var props = PropertiesService.getUserProperties();
  props.setProperty('PINTEREST_CLIENT_ID', clientId);
  props.setProperty('PINTEREST_CLIENT_SECRET', clientSecret);
}

// ── Reporting levels ────────────────────────────────────────────────────────
var PINTEREST_DATA_LEVELS = [
  { value: 'CAMPAIGN',      label: 'Campaign' },
  { value: 'AD_GROUP',      label: 'Ad Group' },
  { value: 'PIN_PROMOTION', label: 'Pin (Ad)' }
];

// ── Granularities ───────────────────────────────────────────────────────────
var PINTEREST_GRANULARITIES = [
  { value: 'DAY',   label: 'Daily' },
  { value: 'TOTAL', label: 'Total' }
];

// ── Breakdowns / Targeting Dimensions ───────────────────────────────────────
var PINTEREST_DIMENSIONS = [
  { value: '',               label: 'None',           category: 'None',         auto: false },
  { value: 'GENDER',         label: 'Gender',         category: 'Demographics', auto: false },
  { value: 'AGE_BUCKET',     label: 'Age Bucket',     category: 'Demographics', auto: false },
  { value: 'TARGETING_TYPE', label: 'Targeting Type',  category: 'Targeting',   auto: false },
  { value: 'COUNTRY',        label: 'Country',        category: 'Geography',    auto: false },
  { value: 'REGION',         label: 'Region',         category: 'Geography',    auto: false },
  { value: 'APPTYPE',        label: 'App Type',       category: 'Device',       auto: false }
];

// ── Metrics catalog ─────────────────────────────────────────────────────────
// Pinterest uses UPPER_SNAKE_CASE column names in the API
var PINTEREST_METRICS_CATALOG = [
  // ─ Delivery ─
  { value: 'IMPRESSION_1',               label: 'Impressions (Organic)',    category: 'Delivery', type: 'metric' },
  { value: 'PAID_IMPRESSION',            label: 'Paid Impressions',        category: 'Delivery', type: 'metric' },
  { value: 'TOTAL_IMPRESSION',           label: 'Total Impressions',       category: 'Delivery', type: 'metric' },

  // ─ Cost ─
  { value: 'SPEND_IN_DOLLAR',            label: 'Spend ($)',               category: 'Cost', type: 'metric' },
  { value: 'SPEND_IN_MICRO_DOLLAR',      label: 'Spend (micro $)',         category: 'Cost', type: 'metric' },
  { value: 'ECPM_IN_DOLLAR',             label: 'eCPM ($)',                category: 'Cost', type: 'metric' },
  { value: 'ECPC_IN_DOLLAR',             label: 'eCPC ($)',                category: 'Cost', type: 'metric' },

  // ─ Clicks ─
  { value: 'TOTAL_CLICKTHROUGH',         label: 'Total Clicks',           category: 'Clicks', type: 'metric' },
  { value: 'PIN_CLICK',                  label: 'Pin Clicks (Closeups)',  category: 'Clicks', type: 'metric' },
  { value: 'OUTBOUND_CLICK',             label: 'Outbound Clicks',       category: 'Clicks', type: 'metric' },
  { value: 'CTR',                        label: 'CTR',                   category: 'Clicks', type: 'metric' },
  { value: 'PIN_CLICK_RATE',             label: 'Pin Click Rate',        category: 'Clicks', type: 'metric' },
  { value: 'OUTBOUND_CLICK_RATE',        label: 'Outbound Click Rate',   category: 'Clicks', type: 'metric' },

  // ─ Engagement ─
  { value: 'TOTAL_ENGAGEMENT',           label: 'Total Engagement',       category: 'Engagement', type: 'metric' },
  { value: 'ENGAGEMENT_RATE',            label: 'Engagement Rate',        category: 'Engagement', type: 'metric' },
  { value: 'SAVE',                       label: 'Saves',                  category: 'Engagement', type: 'metric' },
  { value: 'SAVE_RATE',                  label: 'Save Rate',              category: 'Engagement', type: 'metric' },

  // ─ Video ─
  { value: 'VIDEO_MRC_VIEW',             label: 'Video MRC Views',        category: 'Video', type: 'metric' },
  { value: 'VIDEO_V50_MRC_VIEW',         label: 'Video 50% MRC Views',   category: 'Video', type: 'metric' },
  { value: 'VIDEO_P25_COMBINED',         label: 'Video 25%',              category: 'Video', type: 'metric' },
  { value: 'VIDEO_P50_COMBINED',         label: 'Video 50%',              category: 'Video', type: 'metric' },
  { value: 'VIDEO_P75_COMBINED',         label: 'Video 75%',              category: 'Video', type: 'metric' },
  { value: 'VIDEO_P95_COMBINED',         label: 'Video 95%',              category: 'Video', type: 'metric' },
  { value: 'VIDEO_P100_COMBINED',        label: 'Video 100%',             category: 'Video', type: 'metric' },
  { value: 'VIDEO_AVG_WATCHTIME_IN_SECOND', label: 'Avg Watch Time (s)',  category: 'Video', type: 'metric' },

  // ─ Conversions ─
  { value: 'TOTAL_CONVERSIONS',          label: 'Total Conversions',      category: 'Conversions', type: 'metric' },
  { value: 'TOTAL_CONVERSIONS_VALUE_IN_MICRO_DOLLAR', label: 'Conv Value (micro $)', category: 'Conversions', type: 'metric' },
  { value: 'CHECKOUT_ROAS',              label: 'Checkout ROAS',          category: 'Conversions', type: 'metric' },
  { value: 'PAGE_VISIT',                 label: 'Page Visits',            category: 'Conversions', type: 'metric' },
  { value: 'SIGNUP',                     label: 'Sign Ups',              category: 'Conversions', type: 'metric' },
  { value: 'ADD_TO_CART',                label: 'Add to Cart',           category: 'Conversions', type: 'metric' },
  { value: 'CHECKOUT',                   label: 'Checkouts',             category: 'Conversions', type: 'metric' },
  { value: 'LEAD',                       label: 'Leads',                 category: 'Conversions', type: 'metric' }
];

// ── Sidebar helpers ─────────────────────────────────────────────────────────
function getPinterestMetricsCatalog()  { return JSON.stringify(PINTEREST_METRICS_CATALOG); }
function getPinterestDimensions()      { return JSON.stringify(PINTEREST_DIMENSIONS); }
function getPinterestDataLevels()      { return JSON.stringify(PINTEREST_DATA_LEVELS); }
function getPinterestGranularities()   { return JSON.stringify(PINTEREST_GRANULARITIES); }
