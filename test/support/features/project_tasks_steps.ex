defmodule Operately.Support.Features.ProjectTasksSteps do
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
      |> UI.sleep(300)
    end)

    ctx
    |> UI.click(testid: "submit-new-task")
  end

  step :click_on_task, ctx, attrs do
    ctx
    |> UI.click(testid: attrs.test_id)
  end

  step :edit_task_name, ctx, name do
    ctx
    |> UI.click(testid: "edit-task")
    |> UI.fill(testid: "task-name-input", with: name)
    |> UI.click(testid: "submit-edited-task")
    |> UI.sleep(50)
    |> UI.refute_has(testid: "task-name-input")
    |> UI.refute_has(testid: "submit-edited-task")
  end

  step :edit_task_description, ctx, description do
    ctx
    |> UI.click(testid: "edit-description")
    |> UI.fill_rich_text(description)
    |> UI.click(testid: "submit-edited-task-description")
    |> UI.sleep(50)
    |> UI.refute_has(testid: "submit-edited-task-description")
  end

  step :edit_task_assignees, ctx, assignees do
    ctx
    |> UI.click(testid: "edit-task")

    Enum.each(assignees, fn name ->
      ctx
      |> UI.select_person_in(id: "task-assignees-input", name: name)
      |> UI.sleep(300)
    end)

    ctx
    |> UI.click(testid: "submit-edited-task")
  end

  step :remove_assignee, ctx, assignee do
    testid = "remove-" <> String.replace(assignee, " ", "-") |> String.downcase()

    ctx
    |> UI.click(testid: "edit-task")
    |> UI.click(testid: testid)
    |> UI.click(testid: "submit-edited-task")
  end

  #
  # Assertions
  #

  step :assert_task_added, ctx, attrs do
    UI.find(ctx, UI.query(testid: attrs.test_id), fn ctx ->
      Enum.each(attrs[:assignees] || [], fn name ->
        ctx
        |> UI.assert_has(title: name)
      end)

      ctx
      |> UI.assert_text(attrs.title)
    end)
  end

  step :assert_no_assignee, ctx do
    ctx
    |> UI.assert_text("No one is assigned to this task")
  end

  step :assert_assignees, ctx, assignees do
    UI.find(ctx, UI.query(testid: "assignees-container"), fn ctx ->
      Enum.each(assignees, fn name ->
        ctx
        |> UI.assert_has(title: name)
      end)
    end)
  end

  step :assert_no_specific_assignee, ctx, name do
    UI.find(ctx, UI.query(testid: "assignees-container"), fn ctx ->
      ctx
      |> UI.refute_has(title: name)
    end)
  end
end
