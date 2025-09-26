defmodule Operately.Support.Features.ProjectTasksSteps do
  use Operately.FeatureCase
  alias Operately.Tasks.Task

  step :given_task_exists, ctx do
    ctx
    |> Factory.add_space_member(:creator, :group)
    |> Factory.add_project_task(:task, :milestone, name: "My task")
  end

  step :given_another_milestone_exists, ctx do
    ctx
    |> Factory.add_project_milestone(:another_milestone, :project)
  end

  step :visit_project_page, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
  end

  step :visit_milestone_page, ctx do
    ctx
    |> UI.visit(Paths.project_milestone_path(ctx.company, ctx.milestone))
  end

  step :visit_task_page, ctx do
    ctx
    |> UI.visit(Paths.project_task_path(ctx.company, ctx.task))
  end

  step :reload_task_page, ctx do
    ctx
    |> UI.visit(Paths.project_task_path(ctx.company, ctx.task))
  end

  step :go_to_tasks_tab, ctx do
    ctx
    |> UI.click(testid: "tab-tasks")
  end

  step :go_to_task_page, ctx do
    ctx
    |> UI.click_link(ctx.task.name)
    |> UI.assert_page(Paths.project_task_path(ctx.company, ctx.task))
  end

  step :add_task_from_tasks_board, ctx, attrs do
    ctx
    |> UI.click_button("New task")
    |> UI.fill(placeholder: "Enter task title", with: attrs.name)
    |> if_present(attrs[:assignee], fn ctx ->
      ctx
      |> UI.click(testid: "assignee")
      |> UI.click(testid: UI.testid(["assignee-search-result", attrs.assignee]))
    end)
    |> if_present(attrs[:due_date], fn ctx ->
      ctx
      |> UI.select_day_in_date_field(testid: "task-due-date", date: attrs.due_date)
    end)
    |> if_present(attrs[:milestone], fn ctx ->
      ctx
      |> UI.click(testid: "milestone-field")
      |> UI.click(testid: UI.testid(["milestone-field-search-result", attrs.milestone]))
    end)
    |> UI.click_button("Create task")
    |> UI.sleep(300)
    |> UI.refute_has(testid: "add-task-form")
  end

  step :add_task_from_milestone_page, ctx, title do
    ctx
    |> UI.click(testid: "tasks-section-add-task")
    |> UI.fill(placeholder: "Add a task...", with: title)
    |> UI.press_enter()
    |> UI.sleep(500)
  end

  step :edit_task_name, ctx, name do
    ctx
    |> UI.fill_text_field(testid: "task-name", with: name)
  end

  step :edit_task_description, ctx, description do
    ctx
    |> UI.click_text("Add notes about this task...")
    |> UI.fill_rich_text(description)
    |> UI.click_button("Save")
    |> UI.sleep(300)
  end

  step :edit_task_assignee, ctx, name do
    ctx
    |> UI.find(UI.query(testid: "task-sidebar"), fn el ->
      UI.click(el, testid: "assignee")
    end)
    |> UI.click(testid: UI.testid(["assignee-search-result", name]))
  end

  step :edit_task_due_date, ctx, date do
    ctx
    |> UI.select_day_in_date_field(testid: "task-due-date", date: date)
  end

  step :edit_task_milestone, ctx, name do
    ctx
    |> UI.click(testid: "milestone-field")
    |> UI.click(testid: "milestone-field-change-milestone")
    |> UI.click(testid: UI.testid(["milestone-field-search-result", name]))
  end

  step :remove_task_milestone, ctx do
    ctx
    |> UI.click(testid: "milestone-field")
    |> UI.click(testid: "milestone-field-clear-milestone")
  end

  step :post_comment, ctx, comment do
    ctx
    |> UI.find(UI.query(testid: "task-activity-section"), fn el ->
      el
      |> UI.click_text("Write a comment here...")
      |> UI.fill_rich_text(comment)
      |> UI.click_button("Post")
    end)
    |> UI.sleep(300)
  end

  #
  # Assertions
  #

  step :assert_task_added, ctx, title do
    UI.assert_text(ctx, title)

    task = Task.get!(:system, name: title)

    Map.put(ctx, :task, task)
  end

  step :assert_task_name, ctx, name do
    UI.assert_text(ctx, name, testid: "task-name")
  end

  step :refute_task_name, ctx, name do
    UI.refute_text(ctx, name)
  end

  step :assert_assignee, ctx, name do
    ctx
    |> UI.find(UI.query(testid: "task-sidebar"), fn el ->
      UI.assert_text(el, name, testid: "assignee")
    end)
  end

  step :assert_no_assignee, ctx do
    ctx
    |> UI.find(UI.query(testid: "task-sidebar"), fn el ->
      UI.assert_text(el, "Assign task", testid: "assignee")
    end)
  end

  step :assert_task_due_date, ctx, formatted_date do
    ctx
    |> UI.find(UI.query(testid: "task-sidebar"), fn el ->
      UI.assert_text(el, formatted_date)
    end)
  end

  step :assert_no_due_date, ctx do
    ctx
    |> UI.find(UI.query(testid: "task-sidebar"), fn el ->
      UI.assert_text(el, "Set due date")
    end)
  end

  step :assert_task_milestone, ctx, title do
    ctx
    |> UI.find(UI.query(testid: "task-sidebar"), fn el ->
      UI.assert_text(el, title)
    end)
  end

  step :assert_no_milestone, ctx do
    ctx
    |> UI.find(UI.query(testid: "task-sidebar"), fn el ->
      UI.assert_text(el, "Select milestone")
    end)
  end

  step :assert_task_description, ctx, description do
    UI.assert_text(ctx, description)
  end

  step :refute_task_description, ctx, description do
    UI.refute_text(ctx, description)
  end

  step :assert_change_in_feed, ctx, title do
    ctx
    |> UI.find(UI.query(testid: "task-activity-section"), fn el ->
      el
      |> UI.assert_text(Operately.People.Person.short_name(ctx.champion))
      |> UI.assert_text(title)
    end)
  end

  step :assert_comment, ctx, comment do
    ctx
    |> UI.find(UI.query(testid: "task-activity-section"), fn el ->
      UI.assert_text(el, comment)
    end)
  end

  step :given_task_feed_references_a_deleted_milestone, ctx do
    # Create another milestone and attach the task to it to create an activity
    ctx = ctx |> Factory.add_project_milestone(:another_milestone, :project)

    # Create an activity that references the milestone by directly inserting the activity
    # This simulates the scenario where a task was moved to a milestone that later gets deleted
    activity_attrs = %{
      company_id: ctx.company.id,
      space_id: ctx.group.id,
      project_id: ctx.project.id,
      task_id: ctx.task.id,
      old_milestone_id: nil,
      new_milestone_id: ctx.another_milestone.id
    }

    {:ok, _activity} =
      Ecto.Multi.new()
      |> Operately.Activities.insert_sync(ctx.champion.id, :task_milestone_updating, fn _changes -> activity_attrs end)
      |> Operately.Repo.transaction()

    # Delete the milestone to simulate the scenario where activity references a deleted milestone
    Operately.Repo.delete!(ctx.another_milestone)

    ctx
  end

  step :assert_page_loads_without_errors, ctx do
    # Check that the page loads successfully without any errors
    # This could verify no error messages are displayed and key elements are present
    ctx
    |> UI.assert_has(testid: "task-name")
  end

  step :assert_task_due_date_change_visible_in_feed, ctx, date do
    part1 = "#{Operately.People.Person.first_name(ctx.champion)} changed the due date to"
    part2 = "on #{ctx.task.name} in #{ctx.project.name}"

    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el
      |> UI.assert_text(part1)
      |> UI.assert_text(date)
      |> UI.assert_text("on #{ctx.task.name}")
    end)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.find(UI.query(testid: "space-feed"), fn el ->
      el
      |> UI.assert_text(part1)
      |> UI.assert_text(date)
      |> UI.assert_text(part2)
    end)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.find(UI.query(testid: "company-feed"), fn el ->
      el
      |> UI.assert_text(part1)
      |> UI.assert_text(date)
      |> UI.assert_text(part2)
    end)
  end

  #
  # Helpers
  #

  defp if_present(ctx, nil, _func), do: ctx

  defp if_present(ctx, _property, func) do
    func.(ctx)
  end
end
