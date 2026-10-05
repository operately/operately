defmodule Operately.Notifications.DigestItemsTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Operately.NotificationsFixtures

  alias Operately.Notifications.DigestItems
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    {:ok, ctx}
  end

  @localized_actions ~w(
    comment_added discussion_comment_submitted discussion_editing discussion_posting goal_archived
    goal_champion_updating goal_check_in goal_check_in_acknowledgement goal_check_in_commented goal_closing
    goal_created goal_description_changed goal_discussion_creation goal_editing goal_reopening
    goal_reparent goal_retrospective_acknowledged goal_reviewer_updating goal_timeframe_editing kpi_entry_commented
    milestone_description_updating milestone_due_date_updating project_archived project_champion_updating project_check_in_acknowledged
    project_check_in_commented project_check_in_submitted project_closed project_created project_description_changed
    project_discussion_submitted project_due_date_updating project_goal_connection project_goal_disconnection project_milestone_commented
    project_milestone_creation project_pausing project_resuming project_retrospective_acknowledged project_retrospective_commented
    project_reviewer_updating project_task_commented project_timeline_edited resource_hub_document_commented resource_hub_document_created
    resource_hub_document_deleted resource_hub_document_edited resource_hub_file_commented resource_hub_file_created resource_hub_file_deleted
    resource_hub_link_commented resource_hub_link_created resource_hub_link_deleted resource_hub_link_edited space_joining
    space_task_commented task_adding task_assignee_updating task_description_change task_due_date_updating
    task_moving
  )

  test "every implemented buffered activity translates without changing item metadata", ctx do
    ctx = localization_context(ctx)

    for action <- @localized_actions do
      activity = localized_activity(ctx, action)
      assert_translated_item(ctx, activity)
    end
  end

  test "buffered assignment, date, copy, upload and milestone branches preserve literal values", ctx do
    ctx = localization_context(ctx)
    date = %{"value" => "Sep 14, 2026"}

    scenarios = [
      {"goal_champion_updating", %{"new_champion_id" => ctx.creator.id}},
      {"goal_reviewer_updating", %{"new_reviewer_id" => ctx.creator.id}},
      {"project_champion_updating", %{"new_champion_id" => ctx.creator.id}},
      {"project_reviewer_updating", %{"new_reviewer_id" => ctx.creator.id}},
      {"goal_reparent", %{"new_parent_goal_id" => ctx.goal.id}},
      {"task_assignee_updating", %{"new_assignee_id" => ctx.creator.id}},
      {"task_assignee_updating", %{"old_assignee_id" => ctx.creator.id}},
      {"task_assignee_updating", %{"added_assignee_ids" => [ctx.creator.id, Ecto.UUID.generate()]}},
      {"project_due_date_updating", %{"new_due_date" => "2026-09-14"}},
      {"project_due_date_updating", %{"old_due_date" => "2026-09-13", "new_due_date" => "2026-09-14"}},
      {"task_due_date_updating", %{"new_due_date" => date}},
      {"task_due_date_updating", %{"old_due_date" => date, "new_due_date" => date}},
      {"milestone_due_date_updating", %{"new_due_date" => date}},
      {"milestone_due_date_updating", %{"old_due_date" => date, "new_due_date" => date}},
      {"project_timeline_edited", %{"new_start_date" => "2026-09-01"}},
      {"project_timeline_edited", %{"new_end_date" => "2026-09-14"}},
      {"project_timeline_edited", %{"new_start_date" => "2026-09-01", "new_end_date" => "2026-09-14"}},
      {"resource_hub_document_created", %{"copied_document_id" => ctx.document.id}},
      {"resource_hub_file_created", %{"files" => [%{"file_id" => ctx.file.id}, %{"file_id" => ctx.other_file.id}]}},
      {"project_milestone_commented", %{"comment_action" => "complete"}},
      {"project_milestone_commented", %{"comment_action" => "reopen"}}
    ]

    for {action, overrides} <- scenarios do
      activity = localized_activity(ctx, action, overrides)
      assert_translated_item(ctx, activity)
    end
  end

  test "known check-in statuses translate without changing stored status identifiers", ctx do
    ctx = localization_context(ctx)

    for {status, translated} <- [on_track: "dentro do planejado", off_track: "fora do planejado", caution: "atenção"] do
      Repo.reload!(ctx.check_in) |> Ecto.Changeset.change(status: status) |> Repo.update!()
      Repo.reload!(ctx.update) |> Ecto.Changeset.change(status: status) |> Repo.update!()

      for action <- ["project_check_in_submitted", "goal_check_in"] do
        activity = localized_activity(ctx, action)
        item = assert_translated_item(ctx, activity)
        assert item.headline == ~s(enviou um check-in com status "#{translated}")
      end

      assert Repo.reload!(ctx.check_in).status == status
      assert Repo.reload!(ctx.update).status == status
    end
  end

  defp assert_translated_item(ctx, activity) do
    {:ok, english} = Gettext.with_locale(OperatelyWeb.Gettext, "en", fn -> DigestItems.buffered_item(ctx.creator, activity) end)
    {:ok, portuguese} = Gettext.with_locale(OperatelyWeb.Gettext, "pt_BR", fn -> DigestItems.buffered_item(ctx.creator, activity) end)
    fallback = Gettext.with_locale(OperatelyWeb.Gettext, "fr", fn -> DigestItems.buffered_item(ctx.creator, activity) end)

    assert fallback == {:ok, english}, activity.action
    assert portuguese.headline != english.headline, activity.action
    assert Map.delete(portuguese, :headline) == Map.delete(english, :headline), activity.action
    refute portuguese.headline =~ "%{"
    portuguese
  end

  defp localization_context(ctx) do
    ctx =
      ctx
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal_update(:update, :goal, :creator)
      |> Factory.add_goal_discussion(:goal_discussion, :goal, title: "Goal <literal>")
      |> Factory.add_project_check_in(:check_in, :project, :creator)
      |> Factory.add_project_retrospective(:retrospective, :project, :creator)
      |> Factory.add_project_discussion(:project_discussion, :project, title: "Project <literal>")
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_message(:discussion, :board, title: "Discussion <literal>")
      |> Factory.preload(:discussion, :space)
      |> Factory.add_comment(:comment, :discussion)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub, name: "Document <literal>")
      |> Factory.add_file(:file, :hub)
      |> Factory.add_file(:other_file, :hub)
      |> Factory.add_link(:link, :hub)

    kpi = Operately.KpisFixtures.kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.creator.id, name: "KPI <literal>")
    content = Operately.Support.RichText.rich_text("Literal check-in content")
    check_in = ctx.check_in |> Ecto.Changeset.change(description: content) |> Repo.update!()
    update = ctx.update |> Ecto.Changeset.change(message: content) |> Repo.update!()
    retrospective = ctx.retrospective |> Ecto.Changeset.change(content: content) |> Repo.update!()
    closing = activity_fixture(author_id: ctx.creator.id, action: "goal_closing", content: %{"goal_id" => ctx.goal.id})
    Map.merge(ctx, %{kpi: kpi, check_in: check_in, update: update, retrospective: retrospective, goal_closing: closing})
  end

  defp localized_activity(ctx, action, overrides \\ %{}) do
    discussion_id = if action == "project_discussion_submitted", do: ctx.project_discussion.id, else: ctx.discussion.id
    thread = if action == "comment_added", do: ctx.project_discussion, else: ctx.goal_discussion
    retrospective_id = if action == "goal_retrospective_acknowledged", do: ctx.goal_closing.id, else: ctx.retrospective.id
    content = %{
      "company_id" => ctx.company.id, "space_id" => ctx.space.id, "project_id" => ctx.project.id,
      "goal_id" => ctx.goal.id, "task_id" => ctx.task.id, "milestone_id" => ctx.milestone.id,
      "update_id" => ctx.update.id, "check_in_id" => ctx.check_in.id, "retrospective_id" => retrospective_id,
      "discussion_id" => discussion_id, "comment_thread_id" => thread.id, "comment_id" => ctx.comment.id,
      "document_id" => ctx.document.id, "file_id" => ctx.file.id, "link_id" => ctx.link.id,
      "files" => [%{"file_id" => ctx.file.id}], "kpi_id" => ctx.kpi.id, "comment_action" => "none",
      "description" => Operately.Support.RichText.rich_text("Literal content"),
      "new_description" => Operately.Support.RichText.rich_text("Literal content")
    }
    content = if action == "comment_added", do: Map.delete(content, "goal_id"), else: content
    thread_id = if action == "comment_added", do: nil, else: thread.id
    activity_fixture(author_id: ctx.creator.id, action: action, content: Map.merge(content, overrides), comment_thread_id: thread_id)
  end

  test "skips items when a related task has been deleted", ctx do
    comment_id = Ecto.UUID.generate()

    notifications =
      [
        {"task_assignee_updating", %{"task_id" => ctx.task.id, "old_assignee_id" => nil, "new_assignee_id" => ctx.creator.id}},
        {"task_adding", %{"task_id" => ctx.task.id}},
        {"task_moving", %{"task_id" => ctx.task.id}},
        {"task_due_date_updating", %{"task_id" => ctx.task.id}},
        {"task_description_change", %{"task_id" => ctx.task.id}},
        {"project_task_commented", %{"task_id" => ctx.task.id, "comment_id" => comment_id}},
        {"space_task_commented", %{"task_id" => ctx.task.id, "comment_id" => comment_id}}
      ]
      |> Enum.map(fn {action, content} ->
        activity = activity_fixture(author_id: ctx.creator.id, action: action, content: content)
        notification_fixture(activity_id: activity.id, person_id: ctx.creator.id) |> Repo.preload(:activity)
      end)

    Operately.Repo.delete!(ctx.task)

    assert {[], []} = DigestItems.build(notifications, ctx.creator)
  end

  test "keeps remaining digest items when a deleted-task notification is mixed in", ctx do
    adding_activity = activity_fixture(author_id: ctx.creator.id, action: "task_adding", content: %{"task_id" => ctx.task.id})
    adding = notification_fixture(activity_id: adding_activity.id, person_id: ctx.creator.id) |> Repo.preload(:activity)

    created_activity = activity_fixture(author_id: ctx.creator.id, action: "project_created", content: %{"project_id" => ctx.project.id})
    created = notification_fixture(activity_id: created_activity.id, person_id: ctx.creator.id) |> Repo.preload(:activity)

    Operately.Repo.delete!(ctx.task)

    {items, included} = DigestItems.build([adding, created], ctx.creator)

    assert length(items) == 1
    assert [kept] = included
    assert kept.id == created.id
  end
end
