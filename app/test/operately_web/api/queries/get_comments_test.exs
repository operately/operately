defmodule OperatelyWeb.Api.Queries.GetCommentsTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 2]
  import OperatelyWeb.Api.Serializer
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures
  import Operately.ProjectsFixtures
  import Operately.CommentsFixtures
  import Operately.MessagesFixtures

  alias Operately.Repo
  alias Operately.Support.RichText
  alias Operately.Access.Binding
  alias Operately.Activities.Activity

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_comments, %{})
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
               query(ctx.conn, :get_comments, %{
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
               query(ctx.conn, :get_comments, %{
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
               query(ctx.conn, :get_comments, %{
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
               query(ctx.conn, :get_comments, %{
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
               query(conn, :get_comments, %{
                 entity_id: Paths.project_check_in_id(check_in),
                 entity_type: "project_check_in"
               })

      assert_comments(res, comments)

      # another user's request
      assert {200, res} =
               query(ctx.conn, :get_comments, %{
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
               query(conn, :get_comments, %{
                 entity_id: Paths.project_check_in_id(check_in),
                 entity_type: "project_check_in"
               })

      assert_comments(res, comments)

      # another user's request
      assert {200, res} =
               query(ctx.conn, :get_comments, %{
                 entity_id: Paths.project_check_in_id(check_in),
                 entity_type: "project_check_in"
               })

      assert length(res.comments) == 0
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
               query(ctx.conn, :get_comments, %{
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
               query(ctx.conn, :get_comments, %{
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
               query(ctx.conn, :get_comments, %{
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
               query(ctx.conn, :get_comments, %{
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
               query(conn, :get_comments, %{
                 entity_id: Paths.goal_update_id(update),
                 entity_type: "goal_update"
               })

      assert_comments(res, comments)

      # another user's request
      assert {200, res} =
               query(ctx.conn, :get_comments, %{
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
               query(conn, :get_comments, %{
                 entity_id: Paths.goal_update_id(update),
                 entity_type: "goal_update"
               })

      assert_comments(res, comments)

      # another user's request
      assert {200, res} =
               query(ctx.conn, :get_comments, %{
                 entity_id: Paths.goal_update_id(update),
                 entity_type: "goal_update"
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
               query(ctx.conn, :get_comments, %{
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
               query(ctx.conn, :get_comments, %{
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
               query(ctx.conn, :get_comments, %{
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
               query(ctx.conn, :get_comments, %{
                 entity_id: Paths.message_id(message),
                 entity_type: "message"
               })

      assert length(res.comments) == 0

      # Inside space
      add_person_to_space(ctx, space.id)

      assert {200, res} =
               query(ctx.conn, :get_comments, %{
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
               query(ctx.conn, :get_comments, %{
                 entity_id: Paths.comment_thread_id(thread),
                 entity_type: "comment_thread"
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
               query(ctx.conn, :get_comments, %{
                 entity_id: Paths.comment_thread_id(thread),
                 entity_type: "comment_thread"
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
               query(ctx.conn, :get_comments, %{
                 entity_id: Paths.comment_thread_id(thread),
                 entity_type: "comment_thread"
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
               query(ctx.conn, :get_comments, %{
                 entity_id: Paths.comment_thread_id(thread),
                 entity_type: "comment_thread"
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
               query(conn, :get_comments, %{
                 entity_id: Paths.comment_thread_id(thread),
                 entity_type: "comment_thread"
               })

      assert_comments(res, comments)

      # another user's request
      assert {200, res} =
               query(ctx.conn, :get_comments, %{
                 entity_id: Paths.comment_thread_id(thread),
                 entity_type: "comment_thread"
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
               query(conn, :get_comments, %{
                 entity_id: Paths.comment_thread_id(thread),
                 entity_type: "comment_thread"
               })

      assert_comments(res, comments)

      # another user's request
      assert {200, res} =
               query(ctx.conn, :get_comments, %{
                 entity_id: Paths.comment_thread_id(thread),
                 entity_type: "comment_thread"
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

  defp create_message(creator_id, space_id) do
    board = messages_board_fixture(space_id)

    message_fixture(creator_id, board.id)
    |> Repo.preload(:space)
  end
end
