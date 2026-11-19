defmodule Operately.Support.Features.CuratedTemplatesSteps do
  use Operately.FeatureCase
  alias Operately.CuratedTemplates.Template

  step :create_kpi_draft, ctx do
    ctx
    |> UI.visit("/admin/curated-templates")
    |> UI.click(testid: "create-template")
    |> UI.fill(testid: "title", with: "Retention KPI template")
    |> UI.fill(testid: "definition-unit", with: "%")
    |> UI.click(testid: "definition-cadence")
    |> UI.click(testid: "definition-cadence-option-monthly")
    |> UI.click(testid: "tab-example-data")
    |> UI.click(testid: "add-preview-entry")
    |> UI.fill(testid: "preview-data-entries-0-value", with: "25.5")
    |> UI.click(testid: "save-template-draft")
    |> UI.assert_has(css: "[data-test-id='template-state'][data-state='draft']")
    |> UI.assert_has(testid: "template-details")
    |> UI.refute_has(testid: "curated-template-form")
    |> UI.take_screenshot()
    |> then(fn ctx ->
      template = Repo.get_by!(Template, title: "Retention KPI template")
      assert template.definition["unit"] == "%"
      assert template.definition["name"] == template.title
      assert template.preview_data["entries"] == [%{"period_offset" => -1, "value" => 25.5}]
      Map.put(ctx, :template, template)
    end)
  end

  step :preview_template, ctx do
    path = "/admin/curated-templates/" <> Paths.curated_template_id(ctx.template)
    resource_test_id = %{kpi: "kpi-detail", goal: "goal-page", project: "project-page"}[ctx.template.type]

    ctx
    |> UI.visit("/admin/curated-templates?tab=#{ctx.template.type}")
    |> UI.click_link(ctx.template.title)
    |> UI.assert_has(testid: "template-details")
    |> UI.refute_has(testid: "curated-template-form")
    |> UI.click(testid: "template-actions")
    |> UI.assert_has(css: "[data-test-id='preview-template'][target='_blank']")
    |> UI.visit(path <> "/preview")
    |> UI.assert_has(testid: "template-preview")
    |> UI.assert_has(testid: resource_test_id)
    |> UI.refute_has(css: "input, textarea, [contenteditable='true'], [draggable='true']")
    |> UI.refute_has(testid: "chart-log-update")
    |> UI.take_screenshot()
    |> UI.click(testid: "back-to-template")
    |> UI.assert_has(testid: "template-details")
    |> UI.refute_has(testid: "curated-template-form")
    |> UI.take_screenshot()
    |> then(fn ctx ->
      assert Repo.get!(Template, ctx.template.id).updated_at == ctx.template.updated_at
      ctx
    end)
  end

  step :preview_project_tasks, ctx do
    path = "/admin/curated-templates/" <> Paths.curated_template_id(ctx.template)

    ctx
    |> UI.visit(path <> "/preview?tab=tasks")
    |> UI.assert_has(testid: "tasks-board")
    |> UI.refute_has(testid: "milestone-add-task")
    |> UI.refute_has(css: "[draggable='true']")
    |> UI.click(testid: "task-title-build")
    |> UI.assert_has(testid: "task-slide-in")
    |> UI.refute_has(css: "[data-test-id='task-slide-in'] input, [data-test-id='task-slide-in'] textarea, [contenteditable='true']")
    |> UI.take_screenshot()
    |> then(fn ctx ->
      assert Repo.get!(Template, ctx.template.id).updated_at == ctx.template.updated_at
      ctx
    end)
  end

  step :publish_template, ctx do
    ctx
    |> UI.visit("/admin/curated-templates/" <> Paths.curated_template_id(ctx.template))
    |> UI.click(testid: "template-actions")
    |> UI.click(testid: "edit-template")
    |> UI.click(testid: "publish-template")
    |> UI.assert_has(css: "[data-test-id='template-state'][data-state='published']")
    |> UI.assert_has(testid: "template-details")
    |> UI.refute_has(testid: "curated-template-form")
    |> UI.take_screenshot()
    |> then(fn ctx ->
      assert Repo.get!(Template, ctx.template.id).state == :published
      ctx
    end)
  end

  step :update_published_template, ctx do
    previous_update = Repo.get!(Template, ctx.template.id).updated_at |> DateTime.to_iso8601()

    ctx
    |> UI.visit("/admin/curated-templates/" <> Paths.curated_template_id(ctx.template))
    |> UI.click(testid: "template-actions")
    |> UI.click(testid: "edit-template")
    |> UI.fill(testid: "title", with: "Updated retention")
    |> UI.click(testid: "tab-example-data")
    |> UI.fill(testid: "preview-data-entries-0-value", with: "42.5")
    |> UI.click(testid: "add-preview-annotation")
    |> UI.click(testid: "tab-template")
    |> UI.click(testid: "update-template")
    |> UI.assert_has(testid: "template-errors")
    |> UI.assert_has(testid: "preview-data-annotations-0-title")
    |> UI.fill(testid: "preview-data-annotations-0-title", with: "Campaign launch")
    |> UI.take_screenshot()
    |> UI.click(testid: "update-template")
    |> UI.refute_has(css: "[data-test-id='template-state'][data-updated-at='#{previous_update}']")
    |> UI.assert_has(testid: "template-details")
    |> UI.refute_has(testid: "curated-template-form")
    |> UI.visit("/admin/curated-templates/" <> Paths.curated_template_id(ctx.template))
    |> UI.assert_has(testid: "template-details")
    |> UI.refute_has(testid: "curated-template-form")
    |> UI.click(testid: "template-actions")
    |> UI.click(testid: "edit-template")
    |> UI.assert_has(testid: "title", value: "Updated retention")
    |> then(fn ctx ->
      template = Repo.get!(Template, ctx.template.id)
      assert template.definition["name"] == "Updated retention"
      assert template.preview_data["entries"] == [%{"period_offset" => -1, "value" => 42.5}]
      assert template.preview_data["annotations"] == [%{"period_offset" => -1, "title" => "Campaign launch"}]
      ctx
    end)
  end
end
