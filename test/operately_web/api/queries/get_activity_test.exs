defmodule OperatelyWeb.Api.Queries.GetActivityTest do
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
      assert {401, _} = query(ctx.conn, :get_activity, %{})
    end
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
        permissions: Binding.edit_access(),
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
        permissions: Binding.edit_access(),
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

    test "with no includes", ctx do
      {:ok, _} = Operately.Operations.GoalClosing.run(ctx.creator, ctx.goal, "success", RichText.rich_text("content", :as_string))
      activity = fetch_activity("goal_closing")

      assert {200, res} = query(ctx.conn, :get_activity, %{id: Paths.activity_id(activity)})

      assert res.activity.author == Serializer.serialize(ctx.creator)
      assert res.activity.action == "goal_closing"
      assert res.activity.content.goal.id == ctx.goal.id
      assert res.activity.comment_thread.message == RichText.rich_text("content", :as_string)
    end

    test "include_unread_goal_notifications", ctx do
      {:ok, _} = Operately.Operations.GoalClosing.run(ctx.reviewer, ctx.goal, "success", RichText.rich_text("content", :as_string))
      activity = fetch_activity("goal_closing")

      assert {200, res} = query(ctx.conn, :get_activity, %{id: Paths.activity_id(activity)})
      assert res.activity.notifications == []

      assert {200, res} = query(ctx.conn, :get_activity, %{
        id: Paths.activity_id(activity),
        include_unread_goal_notifications: true,
      })

      assert length(res.activity.notifications) == 1
      assert hd(res.activity.notifications).read == false
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
    assert {404, %{message: msg} = _res} = query(conn, :get_activity, %{id: activity.id})
    assert msg == "The requested resource was not found"
  end

  defp assert_activity(conn, activity, goal) do
    assert {200, res} = query(conn, :get_activity, %{id: activity.id})

    assert res.activity.id == Paths.activity_id(activity)
    assert res.activity.action == "goal_created"
    assert res.activity.content.goal.id == goal.id
  end
end
