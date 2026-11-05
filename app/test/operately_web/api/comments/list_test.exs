defmodule OperatelyWeb.Api.Comments.ListTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 2]
  import OperatelyWeb.Api.Serializer
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures
  import Operately.ProjectsFixtures
  import Operately.CommentsFixtures
  import Operately.MessagesFixtures
  import Operately.KpisFixtures
  import Operately.NotificationsFixtures

  alias Operately.Repo
  alias Operately.Support.RichText
  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias Operately.Operations.TaskMoving
  alias Operately.Tasks.Task

  test "a thread referenced by multiple activities returns each comment once", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_person(:creator) |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal_discussion(:discussion, :goal) |> Factory.add_comment(:comment, :discussion)
    activity = Repo.get_by!(Activity, comment_thread_id: ctx.discussion.id)
    attrs = Map.take(activity, [:author_id, :action, :content, :access_context_id, :comment_thread_id])
    Repo.insert!(struct(Activity, attrs))

    assert {200, response} = query(ctx.conn, [:comments, :list], %{entity_id: Paths.comment_thread_id(ctx.discussion), entity_type: "goal_discussion"})
    assert Enum.map(response.comments, & &1.id) == [Paths.comment_id(ctx.comment)]
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:comments, :list], %{})
    end

    test "it rejects a logged-in request without company context", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.log_in_person(:creator)
        |> Factory.add_space(:space)
        |> Factory.add_goal(:goal, :space)
        |> Factory.add_goal_discussion(:discussion, :goal)

      conn = delete_req_header(ctx.conn, "x-company-id")

      assert {400, %{code: "missing_company_context"}} =
               query(conn, [:comments, :list], %{entity_id: Paths.comment_thread_id(ctx.discussion), entity_type: "goal_discussion"})
    end

    test "it rejects a company the account does not belong to", ctx do
      ctx = ctx |> Factory.setup() |> Factory.log_in_person(:creator)
      other = Factory.setup(%{})
      conn = put_req_header(ctx.conn, "x-company-id", Paths.company_id(other.company))

      assert {404, _} = query(conn, [:comments, :list], %{})
    end

    test "it rejects an unknown company", ctx do
      ctx = ctx |> Factory.setup() |> Factory.log_in_person(:creator)
      conn = put_req_header(ctx.conn, "x-company-id", "not-a-company")

      assert {404, _} = query(conn, [:comments, :list], %{})
    end
  end

  describe "permissions - project check-in" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, space: space})
    end

    test "company members have no access", ctx do
      check_in = create_check_in(ctx, company_access: Binding.no_access())

      Enum.each(1..3, fn _ ->
        add_comment(ctx, check_in, "project_check_in")
      end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.project_check_in_id(check_in),
                 entity_type: "project_check_in"
               })

      assert length(res.comments) == 0
    end

    test "company members have access", ctx do
      check_in = create_check_in(ctx, company_access: Binding.view_access())

      comments =
        Enum.map(1..3, fn _ ->
          add_comment(ctx, check_in, "project_check_in")
        end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.project_check_in_id(check_in),
                 entity_type: "project_check_in"
               })

      assert_comments(res, comments)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      check_in = create_check_in(ctx, space_access: Binding.no_access())

      Enum.each(1..3, fn _ ->
        add_comment(ctx, check_in, "project_check_in")
      end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.project_check_in_id(check_in),
                 entity_type: "project_check_in"
               })

      assert length(res.comments) == 0
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      check_in = create_check_in(ctx, space_access: Binding.view_access())

      comments =
        Enum.map(1..3, fn _ ->
          add_comment(ctx, check_in, "project_check_in")
        end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.project_check_in_id(check_in),
                 entity_type: "project_check_in"
               })

      assert_comments(res, comments)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      check_in = create_check_in(ctx, champion_id: champion.id)

      comments =
        Enum.map(1..3, fn _ ->
          add_comment(ctx, check_in, "project_check_in")
        end)

      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      # champion's request
      assert {200, res} =
               query(conn, [:comments, :list], %{
                 entity_id: Paths.project_check_in_id(check_in),
                 entity_type: "project_check_in"
               })

      assert_comments(res, comments)

      # another user's request
      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.project_check_in_id(check_in),
                 entity_type: "project_check_in"
               })

      assert length(res.comments) == 0
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      check_in = create_check_in(ctx, reviewer_id: reviewer.id)

      comments =
        Enum.map(1..3, fn _ ->
          add_comment(ctx, check_in, "project_check_in")
        end)

      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      # reviewer's request
      assert {200, res} =
               query(conn, [:comments, :list], %{
                 entity_id: Paths.project_check_in_id(check_in),
                 entity_type: "project_check_in"
               })

      assert_comments(res, comments)

      # another user's request
      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.project_check_in_id(check_in),
                 entity_type: "project_check_in"
               })

      assert length(res.comments) == 0
    end
  end

  describe "validation" do
    test "rejects entity types that comments/list does not support", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.log_in_person(:creator)
        |> Factory.add_space(:space)
        |> Factory.add_project(:project, :space)
        |> Factory.add_project_milestone(:milestone, :project)

      assert {400, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.milestone_id(ctx.milestone),
                 entity_type: "milestone"
               })

      assert res.message ==
               "Invalid value for enum comment_list_entity_type: milestone. Allowed values: project_check_in, project_retrospective, project_discussion, goal_update, goal_discussion, message, resource_hub_document, resource_hub_file, resource_hub_link, space_task, project_task, kpi_entry"
    end
  end

  describe "task comments" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_company_member(:origin_member)
      |> Factory.add_company_member(:destination_member)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space, company_access_level: Binding.no_access(), space_access_level: Binding.no_access())
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)
      |> Factory.preload(:task, [:space, project: :group])
      |> Factory.add_comment(:project_comment, :task, content: RichText.rich_text("Before the move"))
      |> Factory.add_reactions(:project_reaction, :project_comment)
      |> Factory.add_space(:destination_space, company_permissions: Binding.no_access())
      |> Factory.enable_space_tool(:destination_space, :tasks)
      |> Factory.add_space(:second_project_space)
      |> Factory.add_project(:second_project, :second_project_space)
      |> add_task_comment_access_members()
    end

    test "lists every task comment once after repeated moves", ctx do
      project_notification = add_unread_comment_notification(ctx.project_comment, ctx.creator)

      {:ok, first_move} = TaskMoving.run(ctx.creator, ctx.task, :space, ctx.destination_space)
      space_task = Task.get!(:system, id: first_move.task.id, opts: [preload: [:project, :space]])

      ctx =
        ctx
        |> Map.put(:task, space_task)
        |> Factory.add_comment(:space_comment, :task, content: RichText.rich_text("After the move"))

      space_notification = add_unread_comment_notification(ctx.space_comment, ctx.creator)

      assert {200, space_response} = list_task_comments(ctx.conn, ctx.task, "space_task")
      assert Enum.map(space_response.comments, & &1.id) == [Paths.comment_id(ctx.project_comment), Paths.comment_id(ctx.space_comment)]
      assert Enum.map(space_response.comments, & &1.notification.id) == [project_notification.id, space_notification.id]

      expected_project_comment = ctx.project_comment |> Repo.preload([:author, reactions: :person]) |> serialize(level: :full)
      assert Map.drop(hd(space_response.comments), [:notification]) == Map.drop(expected_project_comment, [:notification])

      {:ok, second_move} = TaskMoving.run(ctx.creator, ctx.task, :project, ctx.second_project)
      project_task = Task.get!(:system, id: second_move.task.id, opts: [preload: [:project, :space]])

      assert {200, project_response} = list_task_comments(ctx.conn, project_task, "project_task")
      assert Enum.map(project_response.comments, & &1.id) == [Paths.comment_id(ctx.project_comment), Paths.comment_id(ctx.space_comment)]
      assert Enum.map(project_response.comments, & &1.notification.id) == [project_notification.id, space_notification.id]
    end

    test "authorizes historical comments through the current destination", ctx do
      {:ok, moved} = TaskMoving.run(ctx.creator, ctx.task, :space, ctx.destination_space)
      task = Task.get!(:system, id: moved.task.id, opts: [preload: [:project, :space]])

      destination_ctx = Factory.log_in_person(ctx, :destination_member)
      assert {200, response} = list_task_comments(destination_ctx.conn, task, "space_task")
      assert Enum.map(response.comments, & &1.id) == [Paths.comment_id(ctx.project_comment)]

      origin_ctx = Factory.log_in_person(ctx, :origin_member)
      assert {200, response} = list_task_comments(origin_ctx.conn, task, "space_task")
      assert response.comments == []
    end
  end

  describe "resource hub documents" do
    test "lists comments on space-backed documents", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.log_in_person(:creator)
        |> Factory.add_space(:space)
        |> Factory.add_resource_hub(:hub, :space, :creator)
        |> Factory.add_document(:document, :hub)

      comments = add_document_comments(ctx)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.document_id(ctx.document),
                 entity_type: "resource_hub_document"
               })

      assert_comments(res, comments)
    end

    test "lists comments on project-backed documents", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.log_in_person(:creator)
        |> Factory.add_space(:space)
        |> Factory.add_project(:project, :space)
        |> Factory.fetch_default_project_resource_hub(:hub, :project)
        |> Factory.add_document(:document, :hub, state: :draft)

      comments = add_document_comments(ctx)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.document_id(ctx.document),
                 entity_type: "resource_hub_document"
               })

      assert_comments(res, comments)
    end

    test "lists comments on goal-backed documents", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.log_in_person(:creator)
        |> Factory.add_space(:space)
        |> Factory.add_goal(:goal, :space, champion: :creator, reviewer: :creator)
        |> Factory.add_resource_hub(:hub, :goal, :creator)
        |> Factory.add_document(:document, :hub)

      comments = add_document_comments(ctx)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.document_id(ctx.document),
                 entity_type: "resource_hub_document"
               })

      assert_comments(res, comments)
    end

    test "does not list comments without project access", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_company_member(:person)
        |> Factory.log_in_person(:person)
        |> Factory.add_space(:space)
        |> Factory.add_project(:project, :space, company_access_level: Binding.no_access(), space_access_level: Binding.no_access())
        |> Factory.fetch_default_project_resource_hub(:hub, :project)
        |> Factory.add_document(:document, :hub)

      add_document_comments(ctx)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.document_id(ctx.document),
                 entity_type: "resource_hub_document"
               })

      assert res.comments == []
    end
  end

  describe "permissions - goal update" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, space: space})
    end

    test "company members have no access", ctx do
      update = create_goal_update(ctx, company_access: Binding.no_access())

      Enum.each(1..3, fn _ ->
        add_comment(ctx, update, "goal_update")
      end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.goal_update_id(update),
                 entity_type: "goal_update"
               })

      assert length(res.comments) == 0
    end

    test "company members have access", ctx do
      update = create_goal_update(ctx, company_access: Binding.view_access())

      comments =
        Enum.map(1..3, fn _ ->
          add_comment(ctx, update, "goal_update")
        end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.goal_update_id(update),
                 entity_type: "goal_update"
               })

      assert_comments(res, comments)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      update = create_goal_update(ctx, space_access: Binding.no_access())

      Enum.each(1..3, fn _ ->
        add_comment(ctx, update, "goal_update")
      end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.goal_update_id(update),
                 entity_type: "goal_update"
               })

      assert length(res.comments) == 0
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      update = create_goal_update(ctx, space_access: Binding.view_access())

      comments =
        Enum.map(1..3, fn _ ->
          add_comment(ctx, update, "goal_update")
        end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.goal_update_id(update),
                 entity_type: "goal_update"
               })

      assert_comments(res, comments)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      update = create_goal_update(ctx, champion_id: champion.id)

      comments =
        Enum.map(1..3, fn _ ->
          add_comment(ctx, update, "goal_update")
        end)

      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      # champion's request
      assert {200, res} =
               query(conn, [:comments, :list], %{
                 entity_id: Paths.goal_update_id(update),
                 entity_type: "goal_update"
               })

      assert_comments(res, comments)

      # another user's request
      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.goal_update_id(update),
                 entity_type: "goal_update"
               })

      assert length(res.comments) == 0
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      update = create_goal_update(ctx, reviewer_id: reviewer.id)

      comments =
        Enum.map(1..3, fn _ ->
          add_comment(ctx, update, "goal_update")
        end)

      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      # reviewer's request
      assert {200, res} =
               query(conn, [:comments, :list], %{
                 entity_id: Paths.goal_update_id(update),
                 entity_type: "goal_update"
               })

      assert_comments(res, comments)

      # another user's request
      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.goal_update_id(update),
                 entity_type: "goal_update"
               })

      assert length(res.comments) == 0
    end
  end

  describe "permissions - kpi entry" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, space: space})
    end

    test "space members can list comments on a KPI update", ctx do
      add_person_to_space(ctx)
      kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
      entry = kpi_entry_fixture(ctx.creator, kpi)

      comments =
        Enum.map(1..3, fn _ ->
          add_comment(ctx, entry, "kpi_entry")
        end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.kpi_entry_id(entry),
                 entity_type: "kpi_entry"
               })

      assert_comments(res, comments)
    end

    test "non-members cannot list comments on a KPI update", ctx do
      space = group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
      kpi = kpi_fixture(ctx.creator, space_id: space.id)
      entry = kpi_entry_fixture(ctx.creator, kpi)

      Enum.each(1..3, fn _ ->
        add_comment(ctx, entry, "kpi_entry")
      end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.kpi_entry_id(entry),
                 entity_type: "kpi_entry"
               })

      assert length(res.comments) == 0
    end
  end

  describe "permissions - discussions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    test "company space - company members have access", ctx do
      message = create_message(ctx.creator.id, ctx.company.company_space_id)

      comments =
        Enum.map(1..3, fn _ ->
          add_comment(ctx, message, "message")
        end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.message_id(message),
                 entity_type: "message"
               })

      assert_comments(res, comments)
    end

    test "company members have no access", ctx do
      space = create_space(ctx, company_permissions: Binding.no_access())
      message = create_message(ctx.creator.id, space.id)

      Enum.each(1..3, fn _ ->
        add_comment(ctx, message, "message")
      end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.message_id(message),
                 entity_type: "message"
               })

      assert length(res.comments) == 0
    end

    test "company members have access", ctx do
      space = create_space(ctx, company_permissions: Binding.view_access())
      message = create_message(ctx.creator.id, space.id)

      comments =
        Enum.map(1..3, fn _ ->
          add_comment(ctx, message, "message")
        end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.message_id(message),
                 entity_type: "message"
               })

      assert_comments(res, comments)
    end

    test "space members have access", ctx do
      space = create_space(ctx, company_permissions: Binding.no_access())
      message = create_message(ctx.creator.id, space.id)

      comments =
        Enum.map(1..3, fn _ ->
          add_comment(ctx, message, "message")
        end)

      # Outside of space
      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.message_id(message),
                 entity_type: "message"
               })

      assert length(res.comments) == 0

      # Inside space
      add_person_to_space(ctx, space.id)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.message_id(message),
                 entity_type: "message"
               })

      assert_comments(res, comments)
    end
  end

  describe "permissions - comment-thread" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, space: space})
    end

    test "company members have no access", ctx do
      thread = create_comment_thread(ctx, company_access: Binding.no_access())

      Enum.each(1..3, fn _ ->
        add_comment(ctx, thread, "comment_thread")
      end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.comment_thread_id(thread),
                 entity_type: "goal_discussion"
               })

      assert length(res.comments) == 0
    end

    test "company members have access", ctx do
      thread = create_comment_thread(ctx, company_access: Binding.view_access())

      comments =
        Enum.map(1..3, fn _ ->
          add_comment(ctx, thread, "comment_thread")
        end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.comment_thread_id(thread),
                 entity_type: "goal_discussion"
               })

      assert_comments(res, comments)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      thread = create_comment_thread(ctx, space_access: Binding.no_access())

      Enum.each(1..3, fn _ ->
        add_comment(ctx, thread, "comment_thread")
      end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.comment_thread_id(thread),
                 entity_type: "goal_discussion"
               })

      assert length(res.comments) == 0
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      thread = create_comment_thread(ctx, space_access: Binding.view_access())

      comments =
        Enum.map(1..3, fn _ ->
          add_comment(ctx, thread, "comment_thread")
        end)

      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.comment_thread_id(thread),
                 entity_type: "goal_discussion"
               })

      assert_comments(res, comments)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      thread = create_comment_thread(ctx, champion_id: champion.id)

      comments =
        Enum.map(1..3, fn _ ->
          add_comment(ctx, thread, "comment_thread")
        end)

      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      # champion's request
      assert {200, res} =
               query(conn, [:comments, :list], %{
                 entity_id: Paths.comment_thread_id(thread),
                 entity_type: "goal_discussion"
               })

      assert_comments(res, comments)

      # another user's request
      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.comment_thread_id(thread),
                 entity_type: "goal_discussion"
               })

      assert length(res.comments) == 0
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      thread = create_comment_thread(ctx, reviewer_id: reviewer.id)

      comments =
        Enum.map(1..3, fn _ ->
          add_comment(ctx, thread, "comment_thread")
        end)

      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      # reviewer's request
      assert {200, res} =
               query(conn, [:comments, :list], %{
                 entity_id: Paths.comment_thread_id(thread),
                 entity_type: "goal_discussion"
               })

      assert_comments(res, comments)

      # another user's request
      assert {200, res} =
               query(ctx.conn, [:comments, :list], %{
                 entity_id: Paths.comment_thread_id(thread),
                 entity_type: "goal_discussion"
               })

      assert length(res.comments) == 0
    end
  end

  #
  # Helpers
  #

  defp assert_comments(res, comments) do
    assert length(res.comments) == length(comments)

    Enum.each(res.comments, fn c1 ->
      assert Enum.find(comments, &(&1.id == c1.id))
      assert c1.author
      assert c1.reactions
    end)
  end

  defp add_person_to_space(ctx, space_id \\ nil) do
    Operately.Groups.add_members(ctx.person, space_id || ctx.space.id, [
      %{
        id: ctx.person.id,
        access_level: Binding.edit_access()
      }
    ])
  end

  defp create_space(ctx, attrs) do
    group_fixture(ctx.creator, Enum.into(attrs, %{company_id: ctx.company.id}))
  end

  defp create_check_in(ctx, opts) do
    project =
      project_fixture(%{
        company_id: ctx.company.id,
        group_id: ctx.space.id,
        creator_id: ctx.creator.id,
        champion_id: Keyword.get(opts, :champion_id, ctx.creator.id),
        reviewer_id: Keyword.get(opts, :reviewer_id, ctx.creator.id),
        company_access_level: Keyword.get(opts, :company_access, Binding.no_access()),
        space_access_level: Keyword.get(opts, :space_access, Binding.no_access())
      })

    check_in_fixture(%{author_id: ctx.creator.id, project_id: project.id})
    |> Repo.preload(:project)
  end

  defp create_goal_update(ctx, opts) do
    goal =
      goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        champion_id: Keyword.get(opts, :champion_id, ctx.creator.id),
        reviewer_id: Keyword.get(opts, :reviewer_id, ctx.creator.id),
        company_access_level: Keyword.get(opts, :company_access, Binding.no_access()),
        space_access_level: Keyword.get(opts, :space_access, Binding.no_access())
      })

    goal_update_fixture(ctx.creator, goal)
    |> Repo.preload(:goal)
  end

  defp create_comment_thread(ctx, opts) do
    goal =
      goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        champion_id: Keyword.get(opts, :champion_id, ctx.creator.id),
        reviewer_id: Keyword.get(opts, :reviewer_id, ctx.creator.id),
        company_access_level: Keyword.get(opts, :company_access, Binding.no_access()),
        space_access_level: Keyword.get(opts, :space_access, Binding.no_access())
      })

    activity = from(a in Activity, where: a.content["goal_id"] == ^goal.id) |> Repo.one!()
    thread = comment_thread_fixture(parent_id: activity.id)
    {:ok, _} = Operately.Repo.update(Operately.Activities.Activity.changeset(activity, %{comment_thread_id: thread.id}))
    thread
  end

  defp add_comment(ctx, entity, entity_type, content \\ "Hello World") do
    {:ok, comment} = Operately.Operations.CommentAdding.run(ctx.person, entity, entity_type, RichText.rich_text(content))

    Repo.preload(comment, :author)
    |> serialize(level: :full)
  end

  defp add_document_comments(ctx) do
    document = Repo.preload(ctx.document, [:resource_hub, :node])

    Enum.map(1..3, fn _ ->
      {:ok, comment} =
        Operately.Operations.CommentAdding.run(
          ctx.creator,
          document,
          "resource_hub_document",
          RichText.rich_text("Hello World")
        )

      Repo.preload(comment, :author)
      |> serialize(level: :full)
    end)
  end

  defp add_unread_comment_notification(comment, person) do
    activity = from(a in Activity, where: a.content["comment_id"] == ^comment.id) |> Repo.one!()
    notification_fixture(person_id: person.id, activity_id: activity.id, read: false, read_at: nil)
  end

  defp add_task_comment_access_members(ctx) do
    Operately.ProjectsFixtures.contributor_fixture(ctx.creator, %{
      project_id: ctx.project.id,
      person_id: ctx.origin_member.id,
      permissions: Binding.view_access(),
      responsibility: "Origin project member"
    })

    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.destination_space.id, [
      %{id: ctx.destination_member.id, access_level: Binding.view_access()}
    ])

    ctx
  end

  defp list_task_comments(conn, task, entity_type) do
    query(conn, [:comments, :list], %{
      entity_id: Paths.task_id(task),
      entity_type: entity_type
    })
  end

  defp create_message(creator_id, space_id) do
    board = messages_board_fixture(space_id)

    message_fixture(creator_id, board.id)
    |> Repo.preload(:space)
  end
end
