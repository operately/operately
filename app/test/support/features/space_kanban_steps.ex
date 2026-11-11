defmodule Operately.Support.Features.SpaceKanbanSteps do
  use Operately.FeatureCase

  alias Operately.Repo
  alias Operately.Tasks.Task
  alias Operately.Support.Features.UI
  alias Operately.Support.Features.FeedSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps
  alias OperatelyWeb.Paths

  step :setup, ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space, name: "Kanban Space")
      |> Factory.add_space(:destination_space, name: "Destination Space")
      |> Factory.enable_space_tool(:destination_space, :tasks)
      |> Factory.add_project(:destination_project, :destination_space, name: "Destination Project")
      |> Factory.create_space_task(:task, :space, name: "First Task")
      |> Factory.create_space_task(:second_task, :space, name: "Second Task")
      |> Factory.add_space_member(:teammate, :space, name: "Taylor Teammate")
      |> UI.login_based_on_tag()

    status_values = Enum.map(ctx.space.task_statuses, & &1.value)

    Map.put(ctx, :status_values, status_values)
  end

  step :visit_kanban_page, ctx do
    ctx
    |> UI.visit(Paths.space_kanban_path(ctx.company, ctx.space))
    |> UI.assert_has(testid: page_testid(ctx.space))
  end

  step :add_second_board, ctx do
    board = Repo.insert!(%Operately.Tasks.TaskBoard{space_id: ctx.space.id, name: "Support", position: 1, task_statuses: single_status("Support queue")})
    Map.put(ctx, :board, board)
  end

  step :visit_second_board, ctx do
    ctx
    |> UI.visit(Paths.space_kanban_path(ctx.company, ctx.space, ctx.board.id))
    |> UI.assert_has(testid: page_testid(ctx.space))
    |> UI.assert_text(ctx.board.name, testid: "board-name")
  end

  step :assert_default_board_tasks_hidden, ctx do
    ctx
    |> UI.refute_has(testid: card_testid(ctx.task))
    |> UI.refute_has(testid: card_testid(ctx.second_task))
  end

  step :assert_task_on_second_board, ctx, task_key do
    task = Map.fetch!(ctx, task_key) |> Repo.reload!()
    assert task.board_id == ctx.board.id
    ctx
  end

  step :archive_second_board, ctx do
    {:ok, board} = Operately.Operations.TaskBoardArchiving.run(ctx.creator, ctx.space, ctx.board)
    Map.put(ctx, :board, board)
  end

  step :assert_board_read_only, ctx do
    ctx
    |> UI.assert_has(testid: "archived-board-notice")
    |> UI.refute_has(css: "[data-test-id^='add-task-button-'], [data-test-id='add-status'], [data-test-id^='status-menu-trigger-']")
  end

  step :assert_task_controls_read_only, ctx do
    ctx
    |> UI.find([testid: "task-slide-in"], fn ctx ->
      ctx
      |> UI.assert_has(testid: "archived-board-notice")
      |> UI.refute_has(css: "[data-test-id='move-task'], [data-test-id='delete-task'], [data-test-id='archive-task'], [data-test-id='restore-task']")
      |> UI.click(testid: "task-name")
      |> UI.refute_has(testid: "task-name-input")
    end)
  end

  step :assert_task_description_saved, ctx, task_key: task_key, content: content do
    task = Map.fetch!(ctx, task_key) |> Repo.reload!()
    assert Jason.encode!(task.description) =~ content
    ctx
  end

  step :visit_kanban_page, ctx, task_id: task_id do
    path = Paths.space_kanban_path(ctx.company, ctx.space) <> "?taskId=#{task_id}"

    ctx
    |> UI.visit(path)
    |> UI.assert_has(testid: page_testid(ctx.space))
    |> UI.assert_has(testid: "task-slide-in")
  end

  step :create_space_task_through_external_api, ctx, opts do
    conn = api_conn()
    name = Keyword.fetch!(opts, :name)

    inputs = %{
      assignee_id: nil,
      due_date: nil,
      id: Paths.space_id(ctx.space),
      name: name,
      type: "space"
    }

    inputs =
      case Keyword.fetch(opts, :description) do
        {:ok, description} -> Map.put(inputs, :description, description)
        :error -> inputs
      end

    assert {200, res} = OperatelyWeb.TurboCase.external_mutation(conn, ctx.api_token, "tasks/create", inputs)

    Map.put(ctx, :external_api_task_id, res.task.id)
  end

  step :update_task_description_through_external_api, ctx, description: description do
    conn = api_conn()

    assert {200, _res} = OperatelyWeb.TurboCase.external_mutation(conn, ctx.api_token, "tasks/update_description", %{
      task_id: ctx.external_api_task_id,
      description: description,
      type: "space"
    })

    ctx
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

  step :request_status_deletion, ctx, status_value do
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

  step :click_task_link_in_space_feed, ctx, opts do
    task_name = Keyword.fetch!(opts, :task_name)

    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.find(UI.query(testid: "space-feed"), fn el ->
      UI.click_link(el, task_name)
    end)
  end

  step :assert_task_open_from_activity, ctx, task_key do
    task = Map.fetch!(ctx, task_key) |> Repo.reload!()
    path = Paths.create_path([Paths.company_id(ctx.company), "spaces", Paths.space_id(task.space_id), "boards", Operately.ShortUuid.encode!(task.board_id)])

    ctx
    |> UI.assert_location(path <> "?taskId=#{Paths.task_id(task)}")
    |> UI.assert_has(testid: "task-slide-in")
    |> UI.assert_text(task.name, testid: "task-name")
  end

  step :assert_task_renamed, ctx, opts do
    ctx
    |> UI.wait_until_text(opts[:title])
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

  step :delete_empty_status, ctx, opts do
    value = Keyword.fetch!(opts, :value)

    ctx
    |> request_status_deletion(value)
    |> assert_status_absent(value: value)
    |> UI.refute_has(testid: "delete-status-modal")
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
    |> UI.wait_until_has(testid: "task-slide-in")
    |> UI.wait_until_has(testid: "task-header")
    |> UI.sleep(400)
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
    |> UI.wait_until_text(prev_status, testid: "task-status")
    |> UI.click(testid: "task-status")
    |> UI.wait_until_has(testid: UI.testid(["status-option", next_status]))
    |> UI.click(testid: UI.testid(["status-option", next_status]))
    |> UI.refute_text(prev_status, testid: "task-status")
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

  step :add_task_description, ctx, content: content do
    ctx
    |> UI.click_text("Add notes about this task...")
    |> UI.fill_rich_text(content)
    |> UI.click_button("Save")
    |> UI.sleep(300)
  end

  step :add_task_description, ctx, person: person do
    ctx
    |> UI.click_text("Add notes about this task...")
    |> UI.mention_person_in_rich_text(person)
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

  step :move_task_to_project, ctx, opts do
    project_name = Keyword.fetch!(opts, :project_name)
    destination_project_result = UI.testid(["move-task-project-field-search-result", project_name])

    ctx
    |> UI.click(testid: "move-task")
    |> UI.assert_has(testid: "move-task-modal")
    |> UI.click(testid: "move-task-destination-type")
    |> UI.click(testid: "move-task-destination-project")
    |> UI.click(testid: "move-task-project-field")
    |> UI.click(testid: destination_project_result)
    |> UI.click(testid: "confirm-move-task")
    |> UI.sleep(400)
  end

  step :visit_destination_project, ctx do
    UI.visit(ctx, Paths.project_path(ctx.company, ctx.destination_project, tab: "tasks"))
  end

  step :assert_redirected_to_destination_project_task, ctx, task_key do
    task = Map.fetch!(ctx, task_key)

    ctx
    |> UI.assert_page(Paths.project_task_path(ctx.company, task))
    |> UI.assert_has(testid: "task-header")
  end

  step :move_task_to_space, ctx, opts do
    space_name = Keyword.fetch!(opts, :space_name)
    destination_space_result = UI.testid(["move-task-space-field-search-result", space_name])

    ctx
    |> UI.click(testid: "move-task")
    |> UI.assert_has(testid: "move-task-modal")
    |> UI.click(testid: "move-task-destination-type")
    |> UI.click(testid: "move-task-destination-space")
    |> UI.click(testid: "move-task-space-field")
    |> UI.click(testid: destination_space_result)
    |> UI.click(testid: "confirm-move-task")
    |> UI.sleep(400)
  end

  step :open_move_task_modal, ctx do
    ctx
    |> UI.click(testid: "move-task")
    |> UI.assert_has(testid: "move-task-modal")
  end

  step :assert_only_destination_space_shown, ctx do
    destination_space_result = UI.testid(["move-task-space-field-search-result", ctx.destination_space.name])
    original_space_result = UI.testid(["move-task-space-field-search-result", ctx.space.name])

    ctx
    |> UI.click(testid: "move-task-destination-type")
    |> UI.click(testid: "move-task-destination-space")
    |> UI.click(testid: "move-task-space-field")
    |> UI.assert_has(testid: destination_space_result)
    |> UI.refute_has(testid: original_space_result)
  end

  step :visit_destination_space_kanban_page, ctx do
    ctx
    |> UI.visit(Paths.space_kanban_path(ctx.company, ctx.destination_space))
    |> UI.assert_has(testid: page_testid(ctx.destination_space))
  end

  step :assert_redirected_to_destination_space_task, ctx, task_key do
    task = Map.fetch!(ctx, task_key)
    path = Paths.space_kanban_path(ctx.company, ctx.destination_space) <> "?taskId=#{Paths.task_id(task)}"

    ctx
    |> UI.assert_location(path)
    |> UI.assert_has(testid: page_testid(ctx.destination_space))
    |> UI.assert_has(testid: "task-slide-in")
  end

  step :assert_task_removed, ctx, opts do
    task = Map.fetch!(ctx, Keyword.fetch!(opts, :task_key))
    status_value = Keyword.fetch!(opts, :status_value)

    ctx
    |> UI.find([testid: UI.testid(["kanban-column", status_value])], fn ctx ->
      UI.refute_has(ctx, testid: card_testid(task))
    end)
  end

  step :assert_task_present, ctx, opts do
    task = Map.fetch!(ctx, Keyword.fetch!(opts, :task_key))

    ctx
    |> UI.assert_has(testid: project_task_testid(task))
    |> UI.assert_text(task.name)
  end

  step :assert_task_belongs_to_destination_project, ctx, opts do
    task = Repo.get!(Task, Map.fetch!(ctx, Keyword.fetch!(opts, :task_key)).id)
    destination_project = Map.fetch!(ctx, Keyword.fetch!(opts, :destination_project_key))

    assert task.project_id == destination_project.id
    assert task.space_id == nil
    assert task.milestone_id == nil

    ctx
  end

  step :assert_task_belongs_to_destination_space, ctx, opts do
    task = Repo.get!(Task, Map.fetch!(ctx, Keyword.fetch!(opts, :task_key)).id)
    destination_space = Map.fetch!(ctx, Keyword.fetch!(opts, :destination_space_key))

    assert task.space_id == destination_space.id
    assert task.project_id == nil
    assert task.milestone_id == nil

    ctx
  end

  step :add_comment_on_task, ctx, opts do
    comment = Keyword.fetch!(opts, :comment)

    ctx
    |> UI.click_text("Write a comment here...")
    |> UI.fill_rich_text(comment)
    |> UI.click_button("Post")
    |> UI.refute_has(testid: "new-comment-form")
    |> UI.sleep(300)
  end

  step :assert_comment_notification_sent, ctx, opts do
    recipient = Map.fetch!(ctx, Keyword.fetch!(opts, :to))
    task_name = Keyword.fetch!(opts, :task_name)

    ctx
    |> UI.login_as(recipient)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "Re: #{task_name}"
    })
  end

  step :assert_comment_email_sent, ctx, opts do
    recipient = Map.fetch!(ctx, Keyword.fetch!(opts, :to))
    task_name = Keyword.fetch!(opts, :task_name)

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: recipient,
      action: "commented on: #{task_name}",
      author: ctx.creator
    })
  end

  step :assert_assignee_change_notification_sent, ctx, opts do
    assignee = Map.fetch!(ctx, Keyword.fetch!(opts, :to))

    ctx
    |> UI.login_as(assignee)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "Task \"#{ctx.task.name}\" was assigned to #{assignee.full_name}"
    })
  end

  step :assert_assignee_change_email_sent, ctx, opts do
    assignee = Map.fetch!(ctx, Keyword.fetch!(opts, :to))

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: assignee,
      action: "assigned you the task #{ctx.task.name}",
      author: ctx.creator
    })
  end

  step :assert_due_date_change_notification_sent, ctx, opts do
    assignee = Map.fetch!(ctx, Keyword.fetch!(opts, :to))
    task_name = Keyword.fetch!(opts, :task_name)

    ctx
    |> UI.login_as(assignee)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "Updated due date for #{task_name}"
    })
  end

  step :assert_due_date_change_email_sent, ctx, opts do
    assignee = Map.fetch!(ctx, Keyword.fetch!(opts, :to))
    task_name = Keyword.fetch!(opts, :task_name)

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: assignee,
      action: "changed the due date for \"#{task_name}\"",
      author: ctx.creator
    })
  end

  step :assert_description_change_notification_sent, ctx, opts do
    recipient = Map.fetch!(ctx, Keyword.fetch!(opts, :to))
    task_name = Keyword.fetch!(opts, :task_name)

    ctx
    |> UI.login_as(recipient)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "Updated the description of: #{task_name}"
    })
  end

  step :assert_description_change_mentioned_email_sent, ctx, opts do
    recipient = Map.fetch!(ctx, Keyword.fetch!(opts, :to))
    task_name = Keyword.fetch!(opts, :task_name)

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: recipient,
      action: "mentioned you in the description for \"#{task_name}\"",
      author: ctx.creator
    })
  end

  step :assert_description_change_updated_email_sent, ctx, opts do
    recipient = Map.fetch!(ctx, Keyword.fetch!(opts, :to))
    task_name = Keyword.fetch!(opts, :task_name)

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: recipient,
      action: "updated the description for \"#{task_name}\"",
      author: ctx.creator
    })
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
  defp project_task_testid(task), do: UI.testid(["task", Paths.task_id(task)])

  defp api_conn do
    Phoenix.ConnTest.build_conn()
    |> Plug.Conn.put_req_header("content-type", "application/json")
  end
end
