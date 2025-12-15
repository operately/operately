defmodule Operately.Support.Features.MilestoneKanbanSteps do
  use Operately.FeatureCase

  alias Operately.Repo
  alias Operately.Tasks.Task
  alias Operately.Support.Features.UI
  alias OperatelyWeb.Paths

  step :visit_kanban_page, ctx do
    ctx
    |> UI.visit(Paths.project_milestone_kanban_path(ctx.company, ctx.milestone))
    |> UI.assert_has(testid: page_testid(ctx.milestone))
  end

  step :visit_kanban_page_for, ctx, milestone_key do
    milestone = Map.fetch!(ctx, milestone_key)

    ctx
    |> Map.put(:milestone, milestone)
    |> visit_kanban_page()
  end

  step :add_status, ctx, opts do
    label = Keyword.fetch!(opts, :label)
    appearance = Keyword.get(opts, :appearance, "blue")

    ctx
    |> UI.click(testid: "add-status")
    |> UI.fill(testid: "status-name-input", with: label)
    |> UI.click(testid: "status-appearance-trigger")
    |> UI.click(testid: UI.testid(["status-appearance-option", appearance]))
    |> UI.click(testid: "status-save")
    |> UI.sleep(300)
    |> Map.put(:last_status_label, label)
  end

  step :edit_status, ctx, opts do
    status_value = Keyword.fetch!(opts, :status_value)
    new_label = Keyword.fetch!(opts, :new_label)
    appearance = Keyword.get(opts, :appearance, "blue")

    ctx
    |> UI.click(testid: UI.testid(["status-menu-trigger", status_value]))
    |> UI.click(testid: UI.testid(["edit-status", status_value]))
    |> UI.fill(testid: "status-name-input", with: new_label)
    |> UI.click(testid: "status-appearance-trigger")
    |> UI.click(testid: UI.testid(["status-appearance-option", appearance]))
    |> UI.click(testid: "status-save")
    |> UI.sleep(300)
  end

  step :open_status_delete_modal, ctx, status_value do
    ctx
    |> UI.click(testid: UI.testid(["status-menu-trigger", status_value]))
    |> UI.click(testid: UI.testid(["delete-status", status_value]))
  end

  step :assert_status_column, ctx, opts do
    value = Keyword.fetch!(opts, :value)

    UI.assert_has(ctx, testid: UI.testid(["kanban-column", value]))
  end

  step :assert_status_absent, ctx, opts do
    value = Keyword.fetch!(opts, :value)

    UI.refute_has(ctx, testid: UI.testid(["kanban-column", value]))
  end

  step :assert_status_label, ctx, opts do
    value = Keyword.fetch!(opts, :status_value)
    label = Keyword.fetch!(opts, :label)

    ctx
    |> UI.find([testid: UI.testid(["kanban-column-header", value])], fn ctx ->
      UI.assert_text(ctx, label)
    end)
  end

  step :assert_delete_status_blocked, ctx do
    ctx
    |> UI.assert_has(testid: "delete-status-modal")
    |> UI.refute_has(testid: "delete-status-confirm")
  end

  step :close_status_modal, ctx do
    UI.click(ctx, testid: "delete-status-cancel")
  end

  step :delete_status, ctx, opts do
    value = Keyword.fetch!(opts, :value)

    ctx
    |> open_status_delete_modal(value)
    |> UI.click(testid: "delete-status-confirm")
    |> UI.sleep(400)
  end

  step :add_inline_task, ctx, opts do
    status_value = Keyword.fetch!(opts, :status_value)
    title = Keyword.fetch!(opts, :title)

    ctx
    |> UI.click(testid: UI.testid(["add-task-button", status_value]))
    |> UI.fill(testid: UI.testid(["new-task-title", status_value]), with: title)
    |> UI.click(testid: UI.testid(["new-task-submit", status_value]))
    |> UI.sleep(400)
  end

  step :load_task_by_name, ctx, key: key, name: name do
    task = Repo.get_by!(Task, name: name)
    Map.put(ctx, key, task)
  end

  step :assert_task_in_status, ctx, opts do
    task = Map.fetch!(ctx, Keyword.fetch!(opts, :task_key))
    status_value = Keyword.fetch!(opts, :status_value)

    ctx
    |> UI.find([testid: UI.testid(["kanban-column", status_value])], fn ctx ->
      UI.assert_has(ctx, testid: card_testid(task))
    end)
  end

  step :assert_task_absent_in_status, ctx, opts do
    task = Map.fetch!(ctx, Keyword.fetch!(opts, :task_key))
    status_value = Keyword.fetch!(opts, :status_value)

    ctx
    |> UI.find([testid: UI.testid(["kanban-column", status_value])], fn ctx ->
      UI.refute_has(ctx, testid: card_testid(task))
    end)
  end

  step :open_task_slide_in, ctx, task_key do
    task = Map.fetch!(ctx, task_key)

    ctx
    |> UI.click(testid: card_title_testid(task))
    |> UI.assert_has(testid: "task-slide-in")
  end

  step :close_task_slide_in, ctx, _task_key do
    ctx
    |> UI.send_keys([:escape])
    |> UI.sleep(400)
    |> UI.refute_has(testid: "task-slide-in")
  end

  step :change_task_status, ctx, opts do
    task = Map.fetch!(ctx, Keyword.fetch!(opts, :task_key))
    status_value = Keyword.fetch!(opts, :status_value)

    ctx
    |> UI.click(testid: UI.testid(["task-status", Paths.task_id(task)]))
    |> UI.sleep(150)
    |> UI.click(testid: UI.testid(["status-option", status_value]))
    |> UI.sleep(300)
  end

  step :change_task_assignee, ctx, opts do
    task = Map.fetch!(ctx, Keyword.fetch!(opts, :task_key))
    assignee = Keyword.fetch!(opts, :assignee_name)
    testid = UI.testid(["task-assignee", Paths.task_id(task)])

    ctx
    |> UI.click(testid: testid)
    |> UI.send_keys(assignee)
    |> UI.sleep(200)
    |> UI.click(testid: UI.testid([testid, "search-result", assignee]))
    |> UI.sleep(300)
  end

  step :change_task_due_date, ctx, opts do
    task = Map.fetch!(ctx, Keyword.fetch!(opts, :task_key))
    date = Keyword.fetch!(opts, :date)

    ctx
    |> UI.select_day_in_date_field(testid: UI.testid(["task-due-date", Paths.task_id(task)]), date: date)
    |> UI.sleep(300)
  end

  step :assert_card_due_date, ctx, opts do
    task = Map.fetch!(ctx, Keyword.fetch!(opts, :task_key))
    label = Keyword.fetch!(opts, :label)

    ctx
    |> UI.assert_text(label, testid: UI.testid(["kanban-card-due-date", Paths.task_id(task)]))
  end

  step :assert_card_assignee, ctx, opts do
    task = Map.fetch!(ctx, Keyword.fetch!(opts, :task_key))
    assignee = Keyword.fetch!(opts, :assignee_name)

    ctx
    |> UI.assert_has(testid: UI.testid(["kanban-card-assignee-name", Paths.task_id(task)]))
    |> UI.assert_text(assignee, testid: UI.testid(["kanban-card-assignee-name", Paths.task_id(task)]))
  end

  step :add_task_description, ctx, opts do
    task = Map.fetch!(ctx, Keyword.fetch!(opts, :task_key))
    content = Keyword.fetch!(opts, :content)
    testid = UI.testid(["task-description-editor", Paths.task_id(task)])

    ctx =
      try do
        UI.click(ctx, testid: UI.testid(["task-description-add", Paths.task_id(task)]))
      rescue
        _ -> UI.click(ctx, testid: UI.testid(["task-description-edit", Paths.task_id(task)]))
      end

    ctx
    |> UI.fill_rich_text(testid: testid, with: content)
    |> UI.click(testid: UI.testid(["task-description-save", Paths.task_id(task)]))
    |> UI.sleep(300)
  end

  step :assert_description, ctx, opts do
    task = Map.fetch!(ctx, Keyword.fetch!(opts, :task_key))
    content = Keyword.fetch!(opts, :content)

    ctx
    |> UI.assert_text(content, testid: UI.testid(["task-description", Paths.task_id(task)]))
  end

  step :change_task_milestone, ctx, opts do
    task = Map.fetch!(ctx, Keyword.fetch!(opts, :task_key))
    milestone_title = Keyword.fetch!(opts, :milestone_title)
    testid = UI.testid(["task-milestone", Paths.task_id(task)])

    ctx
    |> UI.click(testid: testid)
    |> UI.click(testid: UI.testid([testid, "change-milestone"]))
    |> UI.click(testid: UI.testid([testid, "search-result", milestone_title]))
    |> UI.sleep(300)
  end

  step :delete_task, ctx, opts do
    task = Map.fetch!(ctx, Keyword.fetch!(opts, :task_key))

    ctx
    |> UI.click(testid: UI.testid(["task-delete", Paths.task_id(task)]))
    |> UI.click(testid: UI.testid(["task-delete-confirm", Paths.task_id(task)]))
    |> UI.sleep(400)
  end

  step :assert_task_removed, ctx, opts do
    task = Map.fetch!(ctx, Keyword.fetch!(opts, :task_key))
    status_value = Keyword.fetch!(opts, :status_value)

    ctx
    |> UI.find([testid: UI.testid(["kanban-column", status_value])], fn ctx ->
      UI.refute_has(ctx, testid: card_testid(task))
    end)
  end

  #
  # Helpers
  #

  def status_value_from_label(label) do
    label
    |> String.trim()
    |> String.downcase()
    |> String.replace(~r/\s+/, "_")
  end

  def single_status(label) do
    [
      %Operately.Tasks.Status{
        id: Ecto.UUID.generate(),
        label: label,
        color: :gray,
        index: 0,
        value: status_value_from_label(label),
        closed: false
      }
    ]
  end

  defp page_testid(milestone), do: UI.testid(["milestone-kanban-page", Paths.milestone_id(milestone)])
  defp card_testid(task), do: UI.testid(["kanban-card", Paths.task_id(task)])
  defp card_title_testid(task), do: UI.testid(["kanban-card-title", Paths.task_id(task)])
end
