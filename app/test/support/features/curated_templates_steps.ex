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
    |> UI.click(testid: "save-template-draft")
    |> UI.assert_has(css: "[data-test-id='template-state'][data-state='draft']")
    |> then(fn ctx ->
      template = Repo.get_by!(Template, title: "Retention KPI template")
      assert template.definition["unit"] == "%"
      assert template.definition["name"] == template.title
      Map.put(ctx, :template, template)
    end)
  end

  step :preview_template, ctx do
    path = "/admin/curated-templates/" <> Paths.curated_template_id(ctx.template)
    resource_test_id = %{kpi: "kpi-detail", goal: "goal-page", project: "project-page"}[ctx.template.type]

    ctx
    |> UI.visit(path)
    |> UI.click(testid: "template-actions")
    |> UI.assert_has(css: "[data-test-id='preview-template'][target='_blank']")
    |> UI.visit(path <> "/preview")
    |> UI.assert_has(testid: "template-preview")
    |> UI.assert_has(testid: resource_test_id)
    |> UI.refute_has(css: "input, textarea, [contenteditable='true'], [draggable='true']")
    |> UI.refute_has(testid: "chart-log-update")
    |> UI.take_screenshot()
    |> UI.click(testid: "back-to-template-editor")
    |> UI.assert_has(testid: "title", value: ctx.template.title)
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
    |> UI.click(testid: "publish-template")
    |> UI.assert_has(css: "[data-test-id='template-state'][data-state='published']")
    |> then(fn ctx ->
      assert Repo.get!(Template, ctx.template.id).state == :published
      ctx
    end)
  end

  step :update_published_template, ctx do
    previous_update = Repo.get!(Template, ctx.template.id).updated_at |> DateTime.to_iso8601()

    ctx
    |> UI.fill(testid: "title", with: "Updated retention")
    |> UI.click(testid: "update-template")
    |> UI.refute_has(css: "[data-test-id='template-state'][data-updated-at='#{previous_update}']")
    |> UI.visit("/admin/curated-templates/" <> Paths.curated_template_id(ctx.template))
    |> UI.assert_has(testid: "title", value: "Updated retention")
    |> then(fn ctx ->
      assert Repo.get!(Template, ctx.template.id).definition["name"] == "Updated retention"
      ctx
    end)
  end
end
