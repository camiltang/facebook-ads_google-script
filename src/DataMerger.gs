/**
 * DataMerger.gs — Merges report data from multiple platforms into a single sheet.
 * Joins on common fields (Date, Campaign Name, Ad Group Name, Ad Name, ID).
 */

// ── Common field mapping ────────────────────────────────────────────────────
// Maps each platform's field names to a normalized key.

var COMMON_FIELDS = {
  date: {
    label: 'Date',
    meta:      'date_start',
    tiktok:    'stat_time_day',
    snapchat:  '_date',       // extracted in flatten
    reddit:    '_date',
    pinterest: '_date'
  },
  campaign_name: {
    label: 'Campaign Name',
    meta:      'campaign_name',
    tiktok:    'campaign_name',
    snapchat:  '_campaign_name',
    reddit:    '_campaign_name',
    pinterest: '_campaign_name'
  },
  campaign_id: {
    label: 'Campaign ID',
    meta:      'campaign_id',
    tiktok:    'campaign_id',
    snapchat:  '_entity_id',
    reddit:    '_entity_id',
    pinterest: '_entity_id'
  },
  adset_name: {
    label: 'Ad Group Name',
    meta:      'adset_name',
    tiktok:    'adgroup_name',
    snapchat:  null,
    reddit:    null,
    pinterest: null
  },
  ad_name: {
    label: 'Ad Name',
    meta:      'ad_name',
    tiktok:    'ad_name',
    snapchat:  null,
    reddit:    null,
    pinterest: null
  }
};

// ── Common metric mapping ───────────────────────────────────────────────────
// Normalized metrics that exist across platforms with different names.

var COMMON_METRICS = [
  {
    key: 'impressions', label: 'Impressions',
    meta: 'impressions', tiktok: 'impressions', snapchat: 'impressions',
    reddit: 'impressions', pinterest: 'PAID_IMPRESSION'
  },
  {
    key: 'spend', label: 'Spend',
    meta: 'spend', tiktok: 'spend', snapchat: 'spend',
    reddit: 'spend', pinterest: 'SPEND_IN_DOLLAR'
  },
  {
    key: 'clicks', label: 'Clicks',
    meta: 'clicks', tiktok: 'clicks', snapchat: 'swipes',
    reddit: 'clicks', pinterest: 'TOTAL_CLICKTHROUGH'
  },
  {
    key: 'reach', label: 'Reach',
    meta: 'reach', tiktok: 'reach', snapchat: 'uniques',
    reddit: 'reach', pinterest: null
  },
  {
    key: 'ctr', label: 'CTR',
    meta: 'ctr', tiktok: 'ctr', snapchat: null,
    reddit: 'ctr', pinterest: 'CTR'
  },
  {
    key: 'cpc', label: 'CPC',
    meta: 'cpc', tiktok: 'cpc', snapchat: null,
    reddit: 'cpc', pinterest: 'ECPC_IN_DOLLAR'
  },
  {
    key: 'cpm', label: 'CPM',
    meta: 'cpm', tiktok: 'cpm', snapchat: null,
    reddit: 'ecpm', pinterest: 'ECPM_IN_DOLLAR'
  },
  {
    key: 'frequency', label: 'Frequency',
    meta: 'frequency', tiktok: 'frequency', snapchat: 'frequency',
    reddit: null, pinterest: null
  },
  {
    key: 'video_views', label: 'Video Views',
    meta: 'video_thruplay_watched_actions', tiktok: 'video_play_actions',
    snapchat: 'video_views', reddit: null, pinterest: 'VIDEO_MRC_VIEW'
  },
  {
    key: 'conversions', label: 'Conversions',
    meta: null, tiktok: 'conversion', snapchat: null,
    reddit: null, pinterest: 'TOTAL_CONVERSIONS'
  }
];

/**
 * Returns the common fields and metrics catalogs for the sidebar.
 */
function getMergeFieldsCatalog() {
  var fields = [];
  for (var key in COMMON_FIELDS) {
    fields.push({ value: key, label: COMMON_FIELDS[key].label });
  }
  return JSON.stringify(fields);
}

function getMergeMetricsCatalog() {
  return JSON.stringify(COMMON_METRICS.map(function(m) {
    return { value: m.key, label: m.label };
  }));
}

/**
 * Returns which platforms are currently connected.
 */
function getConnectedPlatforms() {
  var platforms = [];
  try { var s = JSON.parse(getAuthStatus()); if (s.status === 'connected') platforms.push('meta'); } catch(e) {}
  try { var s = JSON.parse(getTikTokAuthStatus()); if (s.status === 'connected') platforms.push('tiktok'); } catch(e) {}
  try { var s = JSON.parse(getSnapAuthStatus()); if (s.status === 'connected') platforms.push('snapchat'); } catch(e) {}
  try { var s = JSON.parse(getRedditAuthStatus()); if (s.status === 'connected') platforms.push('reddit'); } catch(e) {}
  try { var s = JSON.parse(getPinterestAuthStatus()); if (s.status === 'connected') platforms.push('pinterest'); } catch(e) {}
  return JSON.stringify(platforms);
}

/**
 * Runs a cross-platform merged report.
 * @param {string} configJson JSON with:
 *   platforms[] — which platforms to pull from
 *   platformAccounts — { meta: [{id,name}], tiktok: [{id,name}], ... }
 *   mergeFields[] — common field keys to include (e.g. ['date','campaign_name'])
 *   mergeMetrics[] — common metric keys to include (e.g. ['impressions','spend','clicks'])
 *   level — reporting level hint ('campaign','adset','ad')
 *   startDate, endDate — date range
 * @return {string} JSON result
 */
function runMergedReport(configJson) {
  try {
    var config = JSON.parse(configJson);
    var platforms = config.platforms || [];
    var mergeFields = config.mergeFields || ['date', 'campaign_name'];
    var mergeMetrics = config.mergeMetrics || ['impressions', 'spend', 'clicks'];
    var platformAccounts = config.platformAccounts || {};

    if (platforms.length < 2) {
      return JSON.stringify({ success: false, message: 'Select at least 2 platforms to merge.' });
    }

    // Build headers: merge fields + per-platform metric columns
    var headers = [];
    headers.push('Platform');
    mergeFields.forEach(function(fk) {
      var f = COMMON_FIELDS[fk];
      if (f) headers.push(f.label);
    });
    mergeMetrics.forEach(function(mk) {
      var m = findCommonMetric_(mk);
      if (m) headers.push(m.label);
    });

    // Collect rows from each platform
    var allRows = [];
    platforms.forEach(function(platform) {
      try {
        var accounts = platformAccounts[platform] || [];
        var rows = fetchPlatformDataForMerge_(platform, accounts, config, mergeFields, mergeMetrics);
        allRows = allRows.concat(rows);
      } catch (e) {
        Logger.log('Error fetching ' + platform + ' for merge: ' + e.message);
      }
    });

    if (allRows.length === 0) {
      return JSON.stringify({ success: true, sheetName: null, rowCount: 0,
        message: 'No data returned from any platform.' });
    }

    var sheetName = writeReportToSheet(headers, allRows, 'Merged',
      config.startDate + ' to ' + config.endDate, 'Merged');

    return JSON.stringify({
      success: true, sheetName: sheetName, rowCount: allRows.length,
      message: 'Merged report created with ' + allRows.length + ' rows from ' + platforms.length + ' platforms.'
    });
  } catch (e) {
    return JSON.stringify({ success: false, message: e.message });
  }
}

// ── Private helpers ─────────────────────────────────────────────────────────

function fetchPlatformDataForMerge_(platform, accounts, config, mergeFields, mergeMetrics) {
  var rows = [];
  var platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);

  // Determine which native metrics to request for this platform
  var nativeMetrics = [];
  var nativeFieldMetrics = [];
  mergeMetrics.forEach(function(mk) {
    var m = findCommonMetric_(mk);
    if (m && m[platform]) nativeMetrics.push(m[platform]);
  });
  mergeFields.forEach(function(fk) {
    var f = COMMON_FIELDS[fk];
    if (f && f[platform] && f[platform].charAt(0) !== '_') nativeFieldMetrics.push(f[platform]);
  });

  if (platform === 'meta') {
    rows = fetchMetaForMerge_(accounts, config, mergeFields, mergeMetrics, nativeMetrics, nativeFieldMetrics, platformLabel);
  } else if (platform === 'tiktok') {
    rows = fetchTikTokForMerge_(accounts, config, mergeFields, mergeMetrics, nativeMetrics, nativeFieldMetrics, platformLabel);
  } else if (platform === 'snapchat') {
    rows = fetchSnapForMerge_(accounts, config, mergeFields, mergeMetrics, nativeMetrics, platformLabel);
  } else if (platform === 'reddit') {
    rows = fetchRedditForMerge_(accounts, config, mergeFields, mergeMetrics, nativeMetrics, platformLabel);
  } else if (platform === 'pinterest') {
    rows = fetchPinterestForMerge_(accounts, config, mergeFields, mergeMetrics, nativeMetrics, platformLabel);
  }

  return rows;
}

function fetchMetaForMerge_(accounts, config, mergeFields, mergeMetrics, nativeMetrics, nativeFieldMetrics, platformLabel) {
  var rows = [];
  var levelMap = { campaign: 'campaign', adset: 'adset', ad: 'ad' };
  var metaLevel = levelMap[config.level] || 'campaign';
  var allFields = nativeFieldMetrics.concat(nativeMetrics);

  accounts.forEach(function(acct) {
    var apiConfig = {
      accountId: acct.id,
      fields: allFields,
      level: metaLevel,
      datePreset: 'custom',
      since: config.startDate,
      until: config.endDate,
      timeIncrement: '1',
      breakdowns: []
    };

    var rawRows = fetchInsightsSync(apiConfig);
    if (!rawRows) return;

    rawRows.forEach(function(raw) {
      var row = [platformLabel];
      mergeFields.forEach(function(fk) {
        var f = COMMON_FIELDS[fk];
        if (f && f.meta && f.meta.charAt(0) !== '_') {
          row.push(raw[f.meta] || '');
        } else {
          row.push('');
        }
      });
      mergeMetrics.forEach(function(mk) {
        var m = findCommonMetric_(mk);
        if (m && m.meta) {
          var val = raw[m.meta];
          if (Array.isArray(val)) val = extractActionTotal_(val);
          row.push(val != null ? val : '');
        } else {
          row.push('');
        }
      });
      rows.push(row);
    });
  });
  return rows;
}

function fetchTikTokForMerge_(accounts, config, mergeFields, mergeMetrics, nativeMetrics, nativeFieldMetrics, platformLabel) {
  var rows = [];
  var levelMap = { campaign: 'AUCTION_CAMPAIGN', adset: 'AUCTION_ADGROUP', ad: 'AUCTION_AD' };
  var ttLevel = levelMap[config.level] || 'AUCTION_CAMPAIGN';
  var idDimMap = { 'AUCTION_CAMPAIGN': 'campaign_id', 'AUCTION_ADGROUP': 'adgroup_id', 'AUCTION_AD': 'ad_id' };

  accounts.forEach(function(acct) {
    var dimensions = ['stat_time_day'];
    var idDim = idDimMap[ttLevel];
    if (idDim) dimensions.push(idDim);

    var apiConfig = {
      advertiserId: acct.id,
      dataLevel: ttLevel,
      reportType: 'BASIC',
      dimensions: dimensions,
      metrics: nativeFieldMetrics.concat(nativeMetrics),
      startDate: config.startDate,
      endDate: config.endDate
    };

    var rawRows = fetchTikTokReport(apiConfig);
    if (!rawRows) return;

    rawRows.forEach(function(raw) {
      var dims = raw.dimensions || {};
      var met = raw.metrics || {};
      var row = [platformLabel];
      mergeFields.forEach(function(fk) {
        var f = COMMON_FIELDS[fk];
        if (f && f.tiktok) {
          if (f.tiktok.charAt(0) !== '_') {
            row.push(dims[f.tiktok] || met[f.tiktok] || '');
          } else {
            row.push('');
          }
        } else { row.push(''); }
      });
      mergeMetrics.forEach(function(mk) {
        var m = findCommonMetric_(mk);
        if (m && m.tiktok) {
          row.push(met[m.tiktok] != null ? met[m.tiktok] : '');
        } else { row.push(''); }
      });
      rows.push(row);
    });
  });
  return rows;
}

function fetchSnapForMerge_(accounts, config, mergeFields, mergeMetrics, nativeMetrics, platformLabel) {
  var rows = [];
  var levelMap = { campaign: 'campaigns', adset: 'adsquads', ad: 'ads' };

  accounts.forEach(function(acct) {
    var snapConfig = {
      accountId: acct.id,
      level: levelMap[config.level] || 'campaigns',
      fields: nativeMetrics,
      granularity: 'DAY',
      startTime: config.startDate + 'T00:00:00.000Z',
      endTime: config.endDate + 'T23:59:59.000Z',
      breakdown: ''
    };
    var rawStats = fetchSnapStats(snapConfig);
    if (!rawStats) return;

    rawStats.forEach(function(sw) {
      var stat = sw.timeseries_stat || sw.total_stat || sw;
      var entityId = stat.id || '';
      var timeseries = stat.timeseries || [];

      timeseries.forEach(function(ts) {
        var dayStats = ts.stats || {};
        var row = [platformLabel];
        mergeFields.forEach(function(fk) {
          if (fk === 'date') row.push(ts.start_time ? ts.start_time.substring(0, 10) : '');
          else if (fk === 'campaign_id' || fk === 'campaign_name') row.push(entityId);
          else row.push('');
        });
        mergeMetrics.forEach(function(mk) {
          var m = findCommonMetric_(mk);
          if (m && m.snapchat) {
            row.push(dayStats[m.snapchat] != null ? dayStats[m.snapchat] : '');
          } else { row.push(''); }
        });
        rows.push(row);
      });
    });
  });
  return rows;
}

function fetchRedditForMerge_(accounts, config, mergeFields, mergeMetrics, nativeMetrics, platformLabel) {
  var rows = [];
  var levelMap = { campaign: 'campaign', adset: 'adgroup', ad: 'ad' };

  accounts.forEach(function(acct) {
    var redditConfig = {
      accountId: acct.id,
      level: levelMap[config.level] || 'campaign',
      metrics: nativeMetrics,
      startDate: config.startDate,
      endDate: config.endDate,
      granularity: 'DAY',
      breakdown: ''
    };
    var rawRows = fetchRedditReport(redditConfig);
    if (!rawRows) return;

    rawRows.forEach(function(raw) {
      var row = [platformLabel];
      mergeFields.forEach(function(fk) {
        if (fk === 'date') row.push(raw.date || '');
        else if (fk === 'campaign_id') row.push(raw.id || raw.campaign_id || '');
        else if (fk === 'campaign_name') row.push(raw.campaign_name || raw.id || '');
        else row.push('');
      });
      mergeMetrics.forEach(function(mk) {
        var m = findCommonMetric_(mk);
        if (m && m.reddit) {
          row.push(raw[m.reddit] != null ? raw[m.reddit] : '');
        } else { row.push(''); }
      });
      rows.push(row);
    });
  });
  return rows;
}

function fetchPinterestForMerge_(accounts, config, mergeFields, mergeMetrics, nativeMetrics, platformLabel) {
  var rows = [];
  var levelMap = { campaign: 'CAMPAIGN', adset: 'AD_GROUP', ad: 'PIN_PROMOTION' };

  accounts.forEach(function(acct) {
    var pinConfig = {
      accountId: acct.id,
      level: levelMap[config.level] || 'CAMPAIGN',
      columns: nativeMetrics,
      startDate: config.startDate,
      endDate: config.endDate,
      granularity: 'DAY'
    };
    var rawRows = fetchPinterestAnalytics(pinConfig);
    if (!rawRows) return;

    var flatten = function(entity) {
      if (Array.isArray(entity)) {
        entity.forEach(flatten);
        return;
      }
      var row = [platformLabel];
      mergeFields.forEach(function(fk) {
        if (fk === 'date') row.push(entity.DATE || '');
        else if (fk === 'campaign_id') row.push(entity.CAMPAIGN_ID || entity.AD_GROUP_ID || entity.AD_ID || '');
        else row.push('');
      });
      mergeMetrics.forEach(function(mk) {
        var m = findCommonMetric_(mk);
        if (m && m.pinterest) {
          row.push(entity[m.pinterest] != null ? entity[m.pinterest] : '');
        } else { row.push(''); }
      });
      rows.push(row);
    };

    rawRows.forEach(flatten);
  });
  return rows;
}

function findCommonMetric_(key) {
  for (var i = 0; i < COMMON_METRICS.length; i++) {
    if (COMMON_METRICS[i].key === key) return COMMON_METRICS[i];
  }
  return null;
}
