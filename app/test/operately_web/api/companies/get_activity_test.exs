defmodule OperatelyWeb.Api.Companies.GetActivityTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 2]
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures

  alias Operately.{Repo, Groups}
  alias Operately.Access.Binding
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:companies, :get_activity], %{})
    end
  end

  test "project discussion reply activities expose the project to contributors who cannot view the space", ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_contributor(:contributor, :project, :as_person)
      |> Factory.add_project_discussion(:discussion, :project)
      |> Factory.add_comment(:reply, :discussion)
      |> Factory.log_in_person(:contributor)

    assert {:error, :not_found} = Groups.Group.get(ctx.contributor, id: ctx.space.id)
    reply = Repo.one!(from a in Operately.Activities.Activity, where: a.action == "discussion_comment_submitted" and a.content["comment_id"] == ^ctx.reply.id)
    assert {200, %{activity: %{content: content}}} = query(ctx.conn, [:companies, :get_activity], %{id: Paths.activity_id(reply)})
    assert content.project.id == Paths.project_id(ctx.project)
    refute content[:space]
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space, creator: creator})
    end

    test "company members have no access", ctx do
      goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        company_access_level: Binding.no_access(),
      })
      activity = fetch_activity()

      refute_activity(ctx.conn, activity)
    end

    test "company members have access", ctx do
      goal = goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        company_access_level: Binding.view_access(),
      })
      activity = fetch_activity()

      assert_activity(ctx.conn, activity, goal)
    end

    test "space members have no access", ctx do
      Groups.add_members(ctx.person, ctx.space.id, [%{
        id: ctx.person.id,
        access_level: Binding.edit_access(),
      }])
      goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access(),
      })
      activity = fetch_activity()

      refute_activity(ctx.conn, activity)
    end

    test "space members have access", ctx do
      Groups.add_members(ctx.person, ctx.space.id, [%{
        id: ctx.person.id,
        access_level: Binding.edit_access(),
      }])
      goal = goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.view_access(),
      })
      activity = fetch_activity()

      assert_activity(ctx.conn, activity, goal)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        champion_id: champion.id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access(),
      })
      activity = fetch_activity()

      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert_activity(conn, activity, goal)
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        reviewer_id: reviewer.id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access(),
      })
      activity = fetch_activity()

      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert_activity(conn, activity, goal)
    end
  end

  describe "get_activity functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:reviewer, :space)
      |> Factory.add_goal(:goal, :space, reviewer: :reviewer)
    end

    test "task assignee arrays are loaded for an individual activity", ctx do
      ctx = ctx |> Factory.preload(:space, :access_context) |> Factory.create_space_task(:task, :space)

      activity =
        Repo.insert!(%Operately.Activities.Activity{
          action: "task_assignee_updating",
          author_id: ctx.creator.id,
          access_context_id: ctx.space.access_context.id,
          content: %{
            company_id: ctx.company.id,
            space_id: ctx.space.id,
            task_id: ctx.task.id,
            added_assignee_ids: [ctx.reviewer.id],
            removed_assignee_ids: [ctx.creator.id]
          }
        })

      assert {200, res} = query(ctx.conn, [:companies, :get_activity], %{id: Paths.activity_id(activity)})
      assert res.activity.content.added_assignees == [Serializer.serialize(ctx.reviewer)]
      assert res.activity.content.removed_assignees == [Serializer.serialize(ctx.creator)]
    end

    test "with no includes", ctx do
      {:ok, _} = Operately.Operations.GoalClosing.run(ctx.creator, ctx.goal, %{
        success: "success",
        success_status: "achieved",
        content: RichText.rich_text("content"),
        send_notifications_to_everyone: false,
        subscriber_ids: [],
        subscription_parent_type: :comment_thread
      })
      activity = fetch_activity("goal_closing")

      assert {200, res} = query(ctx.conn, [:companies, :get_activity], %{id: Paths.activity_id(activity)})

      assert res.activity.author == Serializer.serialize(ctx.creator)
      assert res.activity.action == "goal_closing"
      assert res.activity.content.goal.id == Paths.goal_id(ctx.goal)
      assert res.activity.comment_thread.message == RichText.rich_text("content", :as_string)
    end

    test "include_unread_goal_notifications", ctx do
      {:ok, _} = Operately.Operations.GoalClosing.run(ctx.reviewer, ctx.goal,  %{
        success: "success",
        success_status: "achieved",
        content: RichText.rich_text("content"),
        send_notifications_to_everyone: false,
        subscriber_ids: [ctx.creator.id],
        subscription_parent_type: :comment_thread
      })
      activity = fetch_activity("goal_closing")

      assert {200, res} = query(ctx.conn, [:companies, :get_activity], %{id: Paths.activity_id(activity)})
      assert res.activity.notifications == []

      assert {200, res} = query(ctx.conn, [:companies, :get_activity], %{
        id: Paths.activity_id(activity),
        include_unread_goal_notifications: true,
      })

      assert length(res.activity.notifications) == 1
      assert hd(res.activity.notifications).read == false
    end
  end

  describe "include_potential_subscribers" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
    end

    test "project discussions with a suspended contributor", ctx do
      ctx = Factory.add_project_contributor(ctx, :suspended_contributor, :project, :as_person)
      ctx = Factory.suspend_company_member(ctx, :suspended_contributor)
      ctx = Factory.add_project_discussion(ctx, :discussion, :project)

      activity =
        from(a in Operately.Activities.Activity, where: a.action == "project_discussion_submitted")
        |> Repo.one!()

      assert {200, %{activity: %{comment_thread: thread}}} = query(ctx.conn, [:companies, :get_activity], %{
        id: Paths.activity_id(activity),
        include_potential_subscribers: true,
        include_subscriptions_list: true,
      })
      assert thread.id == Operately.ShortUuid.encode!(ctx.discussion.id)
      assert thread.reactions == []
      assert thread.subscription_list
      assert is_list(thread.potential_subscribers)
    end
  end

  #
  # Helpers
  #

  defp fetch_activity(action \\ "goal_created") do
    from(a in Operately.Activities.Activity, where: a.action == ^action)
    |> Repo.one!()
  end

  defp refute_activity(conn, activity) do
    assert {404, %{message: msg} = _res} = query(conn, [:companies, :get_activity], %{id: Paths.activity_id(activity)})
    assert msg == "The requested resource was not found"
  end

  defp assert_activity(conn, activity, goal) do
    assert {200, res} = query(conn, [:companies, :get_activity], %{id: Paths.activity_id(activity)})

    assert res.activity.id == Paths.activity_id(activity)
    assert res.activity.action == "goal_created"
    assert res.activity.content.goal.id == Paths.goal_id(goal)
  end
end
