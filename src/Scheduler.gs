/**
 * Scheduler.gs — Manages time-based triggers for recurring reports.
 * Supports two-step async scheduling: Step A (request) then Step B (import ~1h later).
 */

/**
 * Creates a scheduled report with two triggers:
 *  - Trigger A: Fires at the scheduled time to request the async report
 *  - Trigger B: Fires ~1 hour later to import the results
 *
 * @param {Object} scheduleConfig {
 *   uiConfig: { ... report config ... },
 *   frequency: 'daily' | 'weekly' | 'monthly',
 *   dayOfWeek: 1-7 (for weekly, 1=Monday),
 *   dayOfMonth: 1-28 (for monthly),
 *   hour: 0-23 (hour to run in user's timezone)
 * }
 * @return {string} JSON result
 */
function createScheduledReport(scheduleConfig) {
  try {
    var configId = Utilities.getUuid();
    var uiConfigJson = JSON.stringify(scheduleConfig.uiConfig);

    // Save the report config
    saveScheduledConfig_(configId, {
      id: configId,
      uiConfig: scheduleConfig.uiConfig,
      frequency: scheduleConfig.frequency,
      hour: scheduleConfig.hour,
      dayOfWeek: scheduleConfig.dayOfWeek || null,
      dayOfMonth: scheduleConfig.dayOfMonth || null,
      createdAt: new Date().toISOString()
    });

    // Create Step A trigger (request report)
    var triggerA = createTriggerForFrequency_(
      'triggerStepA',
      scheduleConfig.frequency,
      scheduleConfig.hour,
      scheduleConfig.dayOfWeek,
      scheduleConfig.dayOfMonth
    );

    // Create Step B trigger (import results, 1 hour after Step A)
    var stepBHour = (scheduleConfig.hour + 1) % 24;
    var triggerB = createTriggerForFrequency_(
      'triggerStepB',
      scheduleConfig.frequency,
      stepBHour,
      scheduleConfig.dayOfWeek,
      scheduleConfig.dayOfMonth
    );

    // Store trigger IDs so we can delete them later
    var props = PropertiesService.getUserProperties();
    var triggerMap = JSON.parse(props.getProperty('TRIGGER_MAP') || '{}');
    triggerMap[configId] = {
      triggerAId: triggerA.getUniqueId(),
      triggerBId: triggerB.getUniqueId()
    };
    props.setProperty('TRIGGER_MAP', JSON.stringify(triggerMap));

    return JSON.stringify({
      success: true,
      configId: configId,
      message: 'Scheduled report created. Runs ' + scheduleConfig.frequency + ' at ' + formatHour_(scheduleConfig.hour) + '.'
    });
  } catch (e) {
    return JSON.stringify({ success: false, message: e.message });
  }
}

/**
 * Step A trigger handler — requests async reports for all scheduled configs.
 */
function triggerStepA() {
  var configs = getAllScheduledConfigs_();
  Object.keys(configs).forEach(function(configId) {
    try {
      var config = configs[configId];
      // Update date range to "today" context for recurring reports
      var uiConfig = config.uiConfig;
      scheduledRequestReport(JSON.stringify(uiConfig));
      Logger.log('Step A completed for config: ' + configId);
    } catch (e) {
      Logger.log('Step A failed for config ' + configId + ': ' + e.message);
    }
  });
}

/**
 * Step B trigger handler — imports completed async reports.
 */
function triggerStepB() {
  scheduledImportReport();
}

/**
 * Lists all scheduled reports.
 * @return {string} JSON array of scheduled configs
 */
function listScheduledReports() {
  var configs = getAllScheduledConfigs_();
  var list = Object.keys(configs).map(function(id) {
    var c = configs[id];
    return {
      id: c.id,
      accountName: c.uiConfig.accountName || 'Unknown',
      frequency: c.frequency,
      hour: c.hour,
      createdAt: c.createdAt
    };
  });
  return JSON.stringify(list);
}

/**
 * Deletes a scheduled report and its triggers.
 * @param {string} configId
 * @return {string} JSON result
 */
function deleteScheduledReport(configId) {
  try {
    // Delete triggers
    var props = PropertiesService.getUserProperties();
    var triggerMap = JSON.parse(props.getProperty('TRIGGER_MAP') || '{}');
    var triggerIds = triggerMap[configId];

    if (triggerIds) {
      var allTriggers = ScriptApp.getProjectTriggers();
      allTriggers.forEach(function(trigger) {
        if (trigger.getUniqueId() === triggerIds.triggerAId ||
            trigger.getUniqueId() === triggerIds.triggerBId) {
          ScriptApp.deleteTrigger(trigger);
        }
      });
      delete triggerMap[configId];
      props.setProperty('TRIGGER_MAP', JSON.stringify(triggerMap));
    }

    // Remove config
    removeScheduledConfig_(configId);

    return JSON.stringify({ success: true, message: 'Scheduled report deleted.' });
  } catch (e) {
    return JSON.stringify({ success: false, message: e.message });
  }
}

// ── Private helpers ─────────────────────────────────────────────────────────

function createTriggerForFrequency_(functionName, frequency, hour, dayOfWeek, dayOfMonth) {
  var builder = ScriptApp.newTrigger(functionName).timeBased();

  switch (frequency) {
    case 'daily':
      builder.everyDays(1).atHour(hour);
      break;
    case 'weekly':
      var days = [null, ScriptApp.WeekDay.MONDAY, ScriptApp.WeekDay.TUESDAY,
        ScriptApp.WeekDay.WEDNESDAY, ScriptApp.WeekDay.THURSDAY,
        ScriptApp.WeekDay.FRIDAY, ScriptApp.WeekDay.SATURDAY, ScriptApp.WeekDay.SUNDAY];
      builder.onWeekDay(days[dayOfWeek || 1]).atHour(hour);
      break;
    case 'monthly':
      builder.onMonthDay(dayOfMonth || 1).atHour(hour);
      break;
    default:
      builder.everyDays(1).atHour(hour);
  }

  return builder.create();
}

function saveScheduledConfig_(configId, config) {
  var props = PropertiesService.getUserProperties();
  var configs = JSON.parse(props.getProperty(PROP_SCHEDULED_CONFIGS) || '{}');
  configs[configId] = config;
  props.setProperty(PROP_SCHEDULED_CONFIGS, JSON.stringify(configs));
}

function removeScheduledConfig_(configId) {
  var props = PropertiesService.getUserProperties();
  var configs = JSON.parse(props.getProperty(PROP_SCHEDULED_CONFIGS) || '{}');
  delete configs[configId];
  props.setProperty(PROP_SCHEDULED_CONFIGS, JSON.stringify(configs));
}

function getAllScheduledConfigs_() {
  var props = PropertiesService.getUserProperties();
  return JSON.parse(props.getProperty(PROP_SCHEDULED_CONFIGS) || '{}');
}

function formatHour_(h) {
  var suffix = h >= 12 ? 'PM' : 'AM';
  var hour12 = h % 12 || 12;
  return hour12 + ':00 ' + suffix;
}
