/**
 * Config.gs — Constants, API settings, and metrics/dimensions catalog
 * for the Social Ads Reporter Google Sheets Add-On.
 */

// ── Meta API ────────────────────────────────────────────────────────────────
var META_API_VERSION = 'v21.0';
var META_GRAPH_URL   = 'https://graph.facebook.com/' + META_API_VERSION;

// ── OAuth2 ──────────────────────────────────────────────────────────────────
// Users must create a Meta App at https://developers.facebook.com/apps
// and populate these via the sidebar settings panel.
function getMetaClientId()     { return PropertiesService.getUserProperties().getProperty('META_CLIENT_ID')     || ''; }
function getMetaClientSecret() { return PropertiesService.getUserProperties().getProperty('META_CLIENT_SECRET') || ''; }
function setMetaCredentials(clientId, clientSecret) {
  var props = PropertiesService.getUserProperties();
  props.setProperty('META_CLIENT_ID', clientId);
  props.setProperty('META_CLIENT_SECRET', clientSecret);
}

// ── Facebook permissions required ───────────────────────────────────────────
var META_SCOPES = 'ads_read,read_insights,business_management';

// ── Report defaults ─────────────────────────────────────────────────────────
var DEFAULT_LEVEL       = 'campaign';   // ad | adset | campaign | account
var DEFAULT_DATE_PRESET = 'last_30d';
var DEFAULT_TIME_INCREMENT = '1';       // daily
var ASYNC_POLL_INTERVAL_MS = 10000;     // 10 s between async-report polls
var ASYNC_MAX_POLLS        = 60;        // give up after ~10 min

// ── Property keys ───────────────────────────────────────────────────────────
var PROP_SCHEDULED_CONFIGS = 'SCHEDULED_REPORT_CONFIGS';

// ── Available reporting levels ──────────────────────────────────────────────
var REPORTING_LEVELS = [
  { value: 'account',  label: 'Account' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'adset',    label: 'Ad Set' },
  { value: 'ad',       label: 'Ad' }
];

// ── Date-range presets (Meta API preset values) ─────────────────────────────
var DATE_PRESETS = [
  { value: 'today',       label: 'Today' },
  { value: 'yesterday',   label: 'Yesterday' },
  { value: 'last_3d',     label: 'Last 3 Days' },
  { value: 'last_7d',     label: 'Last 7 Days' },
  { value: 'last_14d',    label: 'Last 14 Days' },
  { value: 'last_28d',    label: 'Last 28 Days' },
  { value: 'last_30d',    label: 'Last 30 Days' },
  { value: 'last_90d',    label: 'Last 90 Days' },
  { value: 'this_month',  label: 'This Month' },
  { value: 'last_month',  label: 'Last Month' },
  { value: 'this_quarter',label: 'This Quarter' },
  { value: 'last_year',   label: 'Last Year' },
  { value: 'custom',      label: 'Custom Range' }
];

// ── Time increments ─────────────────────────────────────────────────────────
var TIME_INCREMENTS = [
  { value: '1',        label: 'Daily' },
  { value: '7',        label: 'Weekly' },
  { value: 'monthly',  label: 'Monthly' },
  { value: 'all_days', label: 'Lifetime (no breakdown)' }
];

// ── Dimensions / Breakdowns ─────────────────────────────────────────────────
// These are appended to the API call as &breakdowns=...
var AVAILABLE_BREAKDOWNS = [
  { value: 'age',                    label: 'Age',                   category: 'Demographics' },
  { value: 'gender',                 label: 'Gender',                category: 'Demographics' },
  { value: 'country',                label: 'Country',               category: 'Geography' },
  { value: 'region',                 label: 'Region',                category: 'Geography' },
  { value: 'dma',                    label: 'DMA (US metro)',        category: 'Geography' },
  { value: 'impression_device',      label: 'Impression Device',     category: 'Delivery' },
  { value: 'publisher_platform',     label: 'Publisher Platform',    category: 'Delivery' },
  { value: 'platform_position',      label: 'Platform Position',     category: 'Delivery' },
  { value: 'device_platform',        label: 'Device Platform',       category: 'Delivery' },
  { value: 'product_id',             label: 'Product ID',            category: 'Commerce' },
  { value: 'body_asset',             label: 'Body Asset',            category: 'Creative' },
  { value: 'image_asset',            label: 'Image Asset',           category: 'Creative' },
  { value: 'link_url_asset',         label: 'Link URL Asset',        category: 'Creative' },
  { value: 'title_asset',            label: 'Title Asset',           category: 'Creative' },
  { value: 'video_asset',            label: 'Video Asset',           category: 'Creative' }
];

// ── Metrics catalog ─────────────────────────────────────────────────────────
// Each entry: { value, label, category, type }
// type: 'field' = direct API field, 'action' = nested inside actions[]
var METRICS_CATALOG = [
  // ─ Identity / metadata (always included based on level) ─
  { value: 'account_name',     label: 'Account Name',     category: 'Identity', type: 'field' },
  { value: 'account_id',       label: 'Account ID',       category: 'Identity', type: 'field' },
  { value: 'campaign_name',    label: 'Campaign Name',    category: 'Identity', type: 'field' },
  { value: 'campaign_id',      label: 'Campaign ID',      category: 'Identity', type: 'field' },
  { value: 'adset_name',       label: 'Ad Set Name',      category: 'Identity', type: 'field' },
  { value: 'adset_id',         label: 'Ad Set ID',        category: 'Identity', type: 'field' },
  { value: 'ad_name',          label: 'Ad Name',          category: 'Identity', type: 'field' },
  { value: 'ad_id',            label: 'Ad ID',            category: 'Identity', type: 'field' },
  { value: 'objective',        label: 'Objective',        category: 'Identity', type: 'field' },
  { value: 'date_start',       label: 'Date Start',       category: 'Identity', type: 'field' },
  { value: 'date_stop',        label: 'Date Stop',        category: 'Identity', type: 'field' },

  // ─ Delivery ─
  { value: 'impressions',      label: 'Impressions',      category: 'Delivery', type: 'field' },
  { value: 'reach',            label: 'Reach',            category: 'Delivery', type: 'field' },
  { value: 'frequency',        label: 'Frequency',        category: 'Delivery', type: 'field' },

  // ─ Cost ─
  { value: 'spend',            label: 'Amount Spent',     category: 'Cost',     type: 'field' },
  { value: 'cpc',              label: 'CPC',              category: 'Cost',     type: 'field' },
  { value: 'cpm',              label: 'CPM',              category: 'Cost',     type: 'field' },
  { value: 'cpp',              label: 'CPP',              category: 'Cost',     type: 'field' },

  // ─ Clicks ─
  { value: 'clicks',                label: 'Clicks (All)',            category: 'Clicks',  type: 'field' },
  { value: 'ctr',                   label: 'CTR (All)',               category: 'Clicks',  type: 'field' },
  { value: 'inline_link_clicks',    label: 'Link Clicks',            category: 'Clicks',  type: 'field' },
  { value: 'inline_link_click_ctr', label: 'Link Click CTR',         category: 'Clicks',  type: 'field' },
  { value: 'outbound_clicks',       label: 'Outbound Clicks',        category: 'Clicks',  type: 'field' },
  { value: 'cost_per_inline_link_click', label: 'Cost per Link Click', category: 'Clicks', type: 'field' },

  // ─ Video ─
  { value: 'video_p25_watched_actions',  label: 'Video Plays 25%',   category: 'Video', type: 'field' },
  { value: 'video_p50_watched_actions',  label: 'Video Plays 50%',   category: 'Video', type: 'field' },
  { value: 'video_p75_watched_actions',  label: 'Video Plays 75%',   category: 'Video', type: 'field' },
  { value: 'video_p95_watched_actions',  label: 'Video Plays 95%',   category: 'Video', type: 'field' },
  { value: 'video_p100_watched_actions', label: 'Video Plays 100%',  category: 'Video', type: 'field' },
  { value: 'video_thruplay_watched_actions', label: 'ThruPlays',     category: 'Video', type: 'field' },
  { value: 'video_30_sec_watched_actions', label: '30s Video Views',  category: 'Video', type: 'field' },

  // ─ Engagement (action types) ─
  { value: 'post_engagement',  label: 'Post Engagement',  category: 'Engagement', type: 'action' },
  { value: 'page_engagement',  label: 'Page Engagement',  category: 'Engagement', type: 'action' },
  { value: 'post_reaction',    label: 'Post Reactions',   category: 'Engagement', type: 'action' },
  { value: 'comment',          label: 'Post Comments',    category: 'Engagement', type: 'action' },
  { value: 'post',             label: 'Post Shares',      category: 'Engagement', type: 'action' },
  { value: 'like',             label: 'Page Likes',       category: 'Engagement', type: 'action' },
  { value: 'post_save',        label: 'Post Saves',       category: 'Engagement', type: 'action' },
  { value: 'link_click',       label: 'Link Clicks (Action)', category: 'Engagement', type: 'action' },
  { value: 'landing_page_view',label: 'Landing Page Views', category: 'Engagement', type: 'action' },

  // ─ Conversions (action types) ─
  { value: 'offsite_conversion.fb_pixel_purchase',         label: 'Purchases',                category: 'Conversions', type: 'action' },
  { value: 'offsite_conversion.fb_pixel_add_to_cart',      label: 'Adds to Cart',             category: 'Conversions', type: 'action' },
  { value: 'offsite_conversion.fb_pixel_initiate_checkout',label: 'Checkouts Initiated',      category: 'Conversions', type: 'action' },
  { value: 'offsite_conversion.fb_pixel_view_content',     label: 'Content Views',            category: 'Conversions', type: 'action' },
  { value: 'offsite_conversion.fb_pixel_search',           label: 'Searches',                 category: 'Conversions', type: 'action' },
  { value: 'offsite_conversion.fb_pixel_lead',             label: 'Leads',                    category: 'Conversions', type: 'action' },
  { value: 'offsite_conversion.fb_pixel_complete_registration', label: 'Registrations',       category: 'Conversions', type: 'action' },
  { value: 'onsite_conversion.lead_grouped',               label: 'On-Facebook Leads',        category: 'Conversions', type: 'action' },

  // ─ Conversion values (action_values types) ─
  { value: 'offsite_conversion.fb_pixel_purchase:value',         label: 'Purchase Value',     category: 'Conversion Values', type: 'action_value' },
  { value: 'offsite_conversion.fb_pixel_add_to_cart:value',      label: 'Add to Cart Value',  category: 'Conversion Values', type: 'action_value' },

  // ─ ROAS ─
  { value: 'purchase_roas',    label: 'Purchase ROAS',    category: 'ROAS',     type: 'field' },

  // ─ Quality ─
  { value: 'quality_ranking',          label: 'Quality Ranking',         category: 'Quality', type: 'field' },
  { value: 'engagement_rate_ranking',  label: 'Engagement Rate Ranking', category: 'Quality', type: 'field' },
  { value: 'conversion_rate_ranking',  label: 'Conversion Rate Ranking', category: 'Quality', type: 'field' },

  // ─ Cost per action ─
  { value: 'cost_per_action_type',     label: 'Cost per Result',         category: 'Cost per Action', type: 'field' },
  { value: 'cost_per_unique_click',    label: 'Cost per Unique Click',   category: 'Cost per Action', type: 'field' }
];

/**
 * Returns the catalog as a JSON string for the sidebar.
 */
function getMetricsCatalog() {
  return JSON.stringify(METRICS_CATALOG);
}

function getBreakdownsCatalog() {
  return JSON.stringify(AVAILABLE_BREAKDOWNS);
}

function getDatePresets() {
  return JSON.stringify(DATE_PRESETS);
}

function getTimeIncrements() {
  return JSON.stringify(TIME_INCREMENTS);
}

function getReportingLevels() {
  return JSON.stringify(REPORTING_LEVELS);
}
