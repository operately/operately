defmodule Operately.Support.Features.ProjectTaskSteps do
  use Operately.FeatureCase

  step :visit_milestone_page, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click_link(ctx.milestone.title)
  end

  step :add_task, ctx, attrs do
    ctx
    |> UI.click(testid: "add-task")
    |> UI.fill(testid: "new-task-title", with: attrs.title)
    |> UI.fill_rich_text(attrs.description)

    Enum.each(attrs[:assignees] || [], fn name ->
      ctx
      |> UI.select_person_in(id: "task-assignees-input", name: name)
    end)

    ctx
    |> UI.click(testid: "submit-new-task")
  end

  step :assert_task_added, ctx, attrs do
    UI.find(ctx, UI.query(testid: attrs.test_id), fn ctx ->
      ctx
      |> UI.assert_text(attrs.title)

      Enum.each(attrs[:assignees] || [], fn name ->
        ctx
        |> UI.assert_has(title: name)
      end)
    end)

  end
end
