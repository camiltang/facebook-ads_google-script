/**
 * TikTokConfig.gs — Constants, API settings, and metrics/dimensions catalog
 * for TikTok Ads reporting.
 */

// ── TikTok API ──────────────────────────────────────────────────────────────
var TIKTOK_API_VERSION = 'v1.3';
var TIKTOK_API_BASE    = 'https://business-api.tiktok.com/open_api/' + TIKTOK_API_VERSION;
var TIKTOK_AUTH_URL     = 'https://business-api.tiktok.com/portal/auth';

// ── Credentials (stored per-user) ───────────────────────────────────────────
function getTikTokAppId()     { return PropertiesService.getUserProperties().getProperty('TIKTOK_APP_ID')     || ''; }
function getTikTokAppSecret() { return PropertiesService.getUserProperties().getProperty('TIKTOK_APP_SECRET') || ''; }
function getTikTokAccessToken() { return PropertiesService.getUserProperties().getProperty('TIKTOK_ACCESS_TOKEN') || ''; }

function setTikTokCredentials(appId, appSecret) {
  var props = PropertiesService.getUserProperties();
  props.setProperty('TIKTOK_APP_ID', appId);
  props.setProperty('TIKTOK_APP_SECRET', appSecret);
}

// ── Reporting levels (data_level values) ────────────────────────────────────
var TIKTOK_DATA_LEVELS = [
  { value: 'AUCTION_ADVERTISER', label: 'Advertiser' },
  { value: 'AUCTION_CAMPAIGN',   label: 'Campaign' },
  { value: 'AUCTION_ADGROUP',    label: 'Ad Group' },
  { value: 'AUCTION_AD',         label: 'Ad' }
];

// ── Dimensions ──────────────────────────────────────────────────────────────
var TIKTOK_DIMENSIONS = [
  { value: 'advertiser_id',  label: 'Advertiser ID',  category: 'Identity', auto: true },
  { value: 'campaign_id',    label: 'Campaign ID',    category: 'Identity', auto: false },
  { value: 'adgroup_id',     label: 'Ad Group ID',    category: 'Identity', auto: false },
  { value: 'ad_id',          label: 'Ad ID',          category: 'Identity', auto: false },
  { value: 'stat_time_day',  label: 'Day',            category: 'Time',     auto: true },
  { value: 'stat_time_hour', label: 'Hour',           category: 'Time',     auto: false },
  { value: 'country_code',   label: 'Country',        category: 'Geography', auto: false },
  { value: 'province_id',    label: 'Province',       category: 'Geography', auto: false },
  { value: 'gender',         label: 'Gender',         category: 'Demographics', auto: false },
  { value: 'age',            label: 'Age',            category: 'Demographics', auto: false },
  { value: 'platform',       label: 'Platform',       category: 'Device', auto: false },
  { value: 'ac',             label: 'Network Type',   category: 'Device', auto: false }
];

// ── Metrics catalog ─────────────────────────────────────────────────────────
var TIKTOK_METRICS_CATALOG = [
  // ─ Identity / Name fields (requested as metrics in TikTok API) ─
  { value: 'campaign_name',  label: 'Campaign Name',  category: 'Identity', type: 'metric' },
  { value: 'adgroup_name',   label: 'Ad Group Name',  category: 'Identity', type: 'metric' },
  { value: 'ad_name',        label: 'Ad Name',        category: 'Identity', type: 'metric' },
  { value: 'ad_text',        label: 'Ad Text',        category: 'Identity', type: 'metric' },
  { value: 'objective_type', label: 'Objective',      category: 'Identity', type: 'metric' },

  // ─ Delivery ─
  { value: 'impressions',   label: 'Impressions',    category: 'Delivery', type: 'metric' },
  { value: 'reach',         label: 'Reach',          category: 'Delivery', type: 'metric' },
  { value: 'frequency',     label: 'Frequency',      category: 'Delivery', type: 'metric' },

  // ─ Cost ─
  { value: 'spend',         label: 'Cost (Spend)',   category: 'Cost',     type: 'metric' },
  { value: 'cpc',           label: 'CPC',            category: 'Cost',     type: 'metric' },
  { value: 'cpm',           label: 'CPM',            category: 'Cost',     type: 'metric' },
  { value: 'cost_per_1000_reached', label: 'Cost per 1K Reached', category: 'Cost', type: 'metric' },

  // ─ Clicks ─
  { value: 'clicks',        label: 'Clicks',         category: 'Clicks',   type: 'metric' },
  { value: 'ctr',           label: 'CTR',            category: 'Clicks',   type: 'metric' },
  { value: 'real_time_result', label: 'Results',     category: 'Clicks',   type: 'metric' },
  { value: 'real_time_cost_per_result', label: 'Cost per Result', category: 'Clicks', type: 'metric' },
  { value: 'real_time_result_rate',     label: 'Result Rate',     category: 'Clicks', type: 'metric' },

  // ─ Video ─
  { value: 'video_play_actions',     label: 'Video Views',        category: 'Video', type: 'metric' },
  { value: 'video_watched_2s',       label: '2s Video Views',     category: 'Video', type: 'metric' },
  { value: 'video_watched_6s',       label: '6s Focused Views',   category: 'Video', type: 'metric' },
  { value: 'video_views_p25',        label: 'Video Views 25%',    category: 'Video', type: 'metric' },
  { value: 'video_views_p50',        label: 'Video Views 50%',    category: 'Video', type: 'metric' },
  { value: 'video_views_p75',        label: 'Video Views 75%',    category: 'Video', type: 'metric' },
  { value: 'video_views_p100',       label: 'Video Views 100%',   category: 'Video', type: 'metric' },
  { value: 'average_video_play',     label: 'Avg Watch Time',     category: 'Video', type: 'metric' },
  { value: 'average_video_play_per_user', label: 'Avg Watch Time/User', category: 'Video', type: 'metric' },

  // ─ Engagement ─
  { value: 'likes',            label: 'Likes',          category: 'Engagement', type: 'metric' },
  { value: 'comments',         label: 'Comments',       category: 'Engagement', type: 'metric' },
  { value: 'shares',           label: 'Shares',         category: 'Engagement', type: 'metric' },
  { value: 'follows',          label: 'Follows',        category: 'Engagement', type: 'metric' },
  { value: 'profile_visits',   label: 'Profile Visits', category: 'Engagement', type: 'metric' },

  // ─ Conversions (Web/Pixel) ─
  { value: 'conversion',             label: 'Conversions',        category: 'Conversions', type: 'metric' },
  { value: 'cost_per_conversion',    label: 'Cost per Conversion', category: 'Conversions', type: 'metric' },
  { value: 'conversion_rate',        label: 'Conversion Rate',    category: 'Conversions', type: 'metric' },
  { value: 'complete_payment',       label: 'Purchases',          category: 'Conversions', type: 'metric' },
  { value: 'total_complete_payment_rate', label: 'Purchase Rate',  category: 'Conversions', type: 'metric' },
  { value: 'value_per_complete_payment', label: 'Value per Purchase', category: 'Conversions', type: 'metric' },
  { value: 'total_pageview',          label: 'Page Views',         category: 'Conversions', type: 'metric' },
  { value: 'total_add_to_cart',        label: 'Add to Cart',        category: 'Conversions', type: 'metric' },
  { value: 'total_initiate_checkout',  label: 'Initiate Checkout',  category: 'Conversions', type: 'metric' },

  // ─ In-App Events ─
  { value: 'app_install',             label: 'App Installs',       category: 'App Events', type: 'metric' },
  { value: 'cost_per_app_install',     label: 'Cost per Install',   category: 'App Events', type: 'metric' },
  { value: 'app_event_add_to_cart',    label: 'In-App Add to Cart', category: 'App Events', type: 'metric' },
  { value: 'checkout',                label: 'In-App Checkout',    category: 'App Events', type: 'metric' },
  { value: 'purchase',                label: 'In-App Purchase',    category: 'App Events', type: 'metric' }
];

// ── Helper getters for sidebar ──────────────────────────────────────────────
function getTikTokMetricsCatalog()  { return JSON.stringify(TIKTOK_METRICS_CATALOG); }
function getTikTokDimensions()      { return JSON.stringify(TIKTOK_DIMENSIONS); }
function getTikTokDataLevels()      { return JSON.stringify(TIKTOK_DATA_LEVELS); }
