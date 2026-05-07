const OnboardingStatus = require("../models/OnboardingStatus");

exports.getStatus = async (req, res) => {
  try {
    let status = await OnboardingStatus.findOne({ user: req.user._id });
    if (!status) status = await OnboardingStatus.create({ user: req.user._id });
    const completed = Object.values(status.steps).filter(Boolean).length;
    const total = Object.keys(status.steps).length;
    res.json({ success: true, data: { ...status.toObject(), progress: Math.round((completed / total) * 100) } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.completeStep = async (req, res) => {
  try {
    const { step } = req.body;
    const validSteps = Object.keys(OnboardingStatus.schema.path("steps").caster.schema.paths).filter(p => p !== "_id");
    if (!validSteps.includes(step)) return res.status(400).json({ message: `Invalid step. Valid: ${validSteps.join(", ")}` });

    let status = await OnboardingStatus.findOne({ user: req.user._id });
    if (!status) status = new OnboardingStatus({ user: req.user._id });

    status.steps[step] = true;
    if (!status.completedSteps.includes(step)) status.completedSteps.push(step);

    const stepOrder = validSteps;
    const nextIndex = stepOrder.indexOf(step) + 1;
    status.currentStep = nextIndex < stepOrder.length ? stepOrder[nextIndex] : "done";

    const allDone = validSteps.every(s => status.steps[s]);
    if (allDone) status.completedAt = new Date();

    await status.save();
    res.json({ message: `Step '${step}' completed`, currentStep: status.currentStep });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
