defmodule Operately.Support.Features.SpaceKanbanSteps do
  use Operately.FeatureCase

  alias Operately.Repo
  alias Operately.Tasks.Task
  alias Operately.Support.Features.UI
  alias Operately.Support.Features.FeedSteps
  alias OperatelyWeb.Paths

  step :visit_kanban_page, ctx do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space) <> "/kanban")
    |> UI.assert_has(testid: page_testid(ctx.space))
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

  step :reload_task, ctx, task_key do
    task = Repo.reload(ctx[task_key])

    Map.put(ctx, task_key, task)
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

  step :assert_activity_in_space_and_company_feeds, ctx, opts do
    title = Keyword.fetch!(opts, :title)
    long_title = Keyword.fetch!(opts, :long_title)

    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.find(UI.query(testid: "space-feed"), fn el ->
      FeedSteps.assert_feed_item_exists(el, %{author: ctx.creator, title: title})
    end)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.find(UI.query(testid: "company-feed"), fn el ->
      FeedSteps.assert_feed_item_exists(el, %{author: ctx.creator, title: long_title})
    end)
  end

  step :assert_task_renamed, ctx, opts do
    ctx
    |> UI.assert_text(opts[:title])
    |> UI.refute_text(opts[:old_title])
  end

  step :assert_delete_status_blocked, ctx do
    ctx
    |> UI.assert_has(testid: "delete-status-modal")
    |> UI.refute_has(testid: "delete-status-confirm")
  end

  step :select_deleted_status_replacement, ctx, opts do
    replacement_value = Keyword.fetch!(opts, :replacement_value)

    ctx
    |> UI.click(css: "[data-test-id^=\"deleted-status-replacement-\"]")
    |> UI.sleep(150)
    |> UI.click(testid: UI.testid(["status-option", replacement_value]))
    |> UI.sleep(150)
  end

  step :delete_status, ctx, opts do
    value = Keyword.fetch!(opts, :value)
    replacement_value =
      Keyword.get(opts, :replacement_value) ||
        Enum.find(ctx.status_values, fn v -> v != value end) ||
        hd(ctx.status_values)

    ctx
    |> open_status_delete_modal(value)
    |> select_deleted_status_replacement(replacement_value: replacement_value)
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

  step :rename_task, ctx, opts do
    name = Keyword.fetch!(opts, :name)

    ctx
    |> UI.fill_text_field(testid: "task-name", with: name, submit: true)
    |> UI.sleep(300)
  end

  step :change_task_status, ctx, opts do
    prev_status = Keyword.fetch!(opts, :prev_status)
    next_status = Keyword.fetch!(opts, :next_status)

    ctx
    |> UI.find(UI.query(testid: "task-header"), fn el ->
      UI.click_text(el, prev_status)
    end)
    |> UI.sleep(150)
    |> UI.click(testid: UI.testid(["status-option", next_status]))
    |> UI.sleep(300)
  end

  step :change_task_assignee, ctx, opts do
    assignee = Keyword.fetch!(opts, :assignee_name)

    ctx
    |> UI.click(testid: "assignee")
    |> UI.send_keys(assignee)
    |> UI.sleep(200)
    |> UI.click(testid: UI.testid(["assignee-search-result", assignee]))
    |> UI.sleep(300)
  end

  step :change_task_due_date, ctx, opts do
    date = Keyword.fetch!(opts, :date)

    ctx
    |> UI.select_day_in_date_field(testid: "task-due-date", date: date)
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
    content = Keyword.fetch!(opts, :content)

    ctx
    |> UI.click_text("Add notes about this task...")
    |> UI.fill_rich_text(content)
    |> UI.click_button("Save")
    |> UI.sleep(300)
  end

  step :assert_description, ctx, opts do
    content = Keyword.fetch!(opts, :content)

    ctx
    |> UI.assert_text(content, testid: "task-slide-in")
  end

  step :delete_task, ctx do
    ctx
    |> UI.click(testid: "delete-task")
    |> UI.click_button("Delete Forever")
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

  defp page_testid(space), do: UI.testid(["space-kanban-page", Paths.space_id(space)])
  defp card_testid(task), do: UI.testid(["kanban-card", Paths.task_id(task)])
  defp card_title_testid(task), do: UI.testid(["kanban-card-title", Paths.task_id(task)])
end
