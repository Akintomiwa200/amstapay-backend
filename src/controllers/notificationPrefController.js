const NotificationPreference = require("../models/NotificationPreference");

exports.getPreferences = async (req, res) => {
  try {
    let prefs = await NotificationPreference.findOne({ user: req.user._id });
    if (!prefs) prefs = await NotificationPreference.create({ user: req.user._id });
    res.json({ success: true, data: prefs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const prefs = await NotificationPreference.findOneAndUpdate(
      { user: req.user._id },
      { $set: req.body },
      { upsert: true, new: true },
    );
    res.json({ message: "Preferences updated", data: prefs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.shouldSend = async (userId, channel, eventType) => {
  try {
    const prefs = await NotificationPreference.findOne({ user: userId });
    if (!prefs) return true;
    const channelPrefs = prefs[channel];
    if (!channelPrefs || !channelPrefs.enabled) return false;
    if (prefs.quietHours?.enabled) {
      const now = new Date();
      const hour = now.getHours();
      const start = parseInt(prefs.quietHours.start);
      const end = parseInt(prefs.quietHours.end);
      if (start <= end ? (hour >= start && hour < end) : (hour >= start || hour < end)) return false;
    }
    return channelPrefs[eventType] !== false;
  } catch {
    return true;
  }
};
