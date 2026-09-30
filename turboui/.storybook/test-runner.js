const DEFAULT_VIEWPORT = { width: 1280, height: 720 };
const NARROW_VIEWPORT_STORIES = {
  "components-taskcreationmodal--project-template-focused": { width: 320, height: 568 },
};

module.exports = {
  async preVisit(page, context) {
    await page.setViewportSize(NARROW_VIEWPORT_STORIES[context.id] ?? DEFAULT_VIEWPORT);
  },
};
