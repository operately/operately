defmodule OperatelyWeb.Api.Queries.GetActivitiesTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures

  alias Operately.Repo
  alias Operately.Groups
  alias Operately.Access.Binding
  alias OperatelyWeb.Paths
  alias Operately.Activities.Activity

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_activities, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)

      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      space = group_fixture(champion)

      attrs = %{
        scope_type: "company",
        scope_id: Paths.company_id(ctx.company),
        actions: ["goal_created"]
      }

      Map.merge(ctx, %{space: space, champion: champion, reviewer: reviewer, attrs: attrs})
    end

    test "company members have no access", ctx do
      goal_fixture(ctx.champion, %{
        space_id: ctx.company.company_space_id,
        company_access_level: Binding.no_access()
      })

      assert {200, res} = query(ctx.conn, :get_activities, ctx.attrs)

      assert res.activities == []
    end

    test "company members have access", ctx do
      goal =
        goal_fixture(ctx.champion, %{
          space_id: ctx.company.company_space_id,
          company_access_level: Binding.view_access()
        })

      assert {200, %{activities: activities} = _res} = query(ctx.conn, :get_activities, ctx.attrs)

      assert length(activities) == 1
      assert Paths.goal_id(goal) == hd(activities).content.goal.id
    end

    test "space members have no access", ctx do
      Groups.add_members(ctx.champion, ctx.space.id, [%{id: ctx.person.id, access_level: Binding.edit_access()}])

      goal_fixture(ctx.champion, %{
        space_id: ctx.space.id,
        space_access_level: Binding.no_access(),
        company_access_level: Binding.no_access()
      })

      assert {200, res} = query(ctx.conn, :get_activities, ctx.attrs)

      assert res.activities == []
    end

    test "space members have access", ctx do
      Groups.add_members(ctx.champion, ctx.space.id, [%{id: ctx.person.id, access_level: Binding.edit_access()}])

      goal =
        goal_fixture(ctx.champion, %{
          space_id: ctx.space.id,
          space_access_level: Binding.view_access(),
          company_access_level: Binding.no_access()
        })

      assert {200, %{activities: activities} = _res} = query(ctx.conn, :get_activities, ctx.attrs)

      assert length(activities) == 1
      assert Paths.goal_id(goal) == hd(activities).content.goal.id
    end

    test "reviewers have access", ctx do
      goal =
        goal_fixture(ctx.champion, %{
          space_id: ctx.space.id,
          reviewer_id: ctx.reviewer.id,
          space_access_level: Binding.no_access(),
          company_access_level: Binding.no_access()
        })

      account = Repo.preload(ctx.reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, %{activities: activities} = _res} = query(conn, :get_activities, ctx.attrs)

      assert length(activities) == 1
      assert Paths.goal_id(goal) == hd(activities).content.goal.id
    end

    test "champions have access", ctx do
      goal =
        goal_fixture(ctx.reviewer, %{
          space_id: ctx.space.id,
          champion_id: ctx.champion.id,
          space_access_level: Binding.no_access(),
          company_access_level: Binding.no_access()
        })

      account = Repo.preload(ctx.champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, %{activities: activities} = _res} = query(conn, :get_activities, ctx.attrs)

      assert length(activities) == 1
      assert Paths.goal_id(goal) == hd(activities).content.goal.id
    end
  end

  describe "get_activities functionality" do
    setup :register_and_log_in_account
  end

  describe "activity scope types" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_project(:project, :space)
      |> create_milestone()
      |> create_task()
    end

    test "company scope includes all activities", ctx do
      assert {200, res} =
               query(ctx.conn, :get_activities, %{
                 scope_type: :company,
                 scope_id: Paths.company_id(ctx.company),
                 actions: []
               })

      assert Enum.find(res.activities, fn act -> act.action == "company_adding" end)
      assert Enum.find(res.activities, fn act -> act.action == "space_added" end)
      assert Enum.find(res.activities, fn act -> act.action == "goal_created" end)
      assert Enum.find(res.activities, fn act -> act.action == "project_created" end)
      assert Enum.find(res.activities, fn act -> act.action == "project_milestone_creation" end)
      assert Enum.find(res.activities, fn act -> act.action == "task_adding" end)
    end

    test "space scope includes space, goal, project, and task activities", ctx do
      assert {200, res} =
               query(ctx.conn, :get_activities, %{
                 scope_type: :space,
                 scope_id: Paths.space_id(ctx.space),
                 actions: []
               })

      refute Enum.find(res.activities, fn act -> act.action == "company_adding" end)
      assert Enum.find(res.activities, fn act -> act.action == "space_added" end)
      assert Enum.find(res.activities, fn act -> act.action == "goal_created" end)
      assert Enum.find(res.activities, fn act -> act.action == "project_created" end)
      assert Enum.find(res.activities, fn act -> act.action == "project_milestone_creation" end)
      assert Enum.find(res.activities, fn act -> act.action == "task_adding" end)
    end

    test "project scope includes project and task activities", ctx do
      assert {200, res} =
               query(ctx.conn, :get_activities, %{
                 scope_type: :project,
                 scope_id: Paths.project_id(ctx.project),
                 actions: []
               })

      refute Enum.find(res.activities, fn act -> act.action == "company_adding" end)
      refute Enum.find(res.activities, fn act -> act.action == "space_added" end)
      refute Enum.find(res.activities, fn act -> act.action == "goal_created" end)
      assert Enum.find(res.activities, fn act -> act.action == "project_created" end)
      assert Enum.find(res.activities, fn act -> act.action == "project_milestone_creation" end)
      assert Enum.find(res.activities, fn act -> act.action == "task_adding" end)
    end

    test "goal scope includes only goal activities", ctx do
      assert {200, res} =
               query(ctx.conn, :get_activities, %{
                 scope_type: :goal,
                 scope_id: Paths.goal_id(ctx.goal),
                 actions: []
               })

      refute Enum.find(res.activities, fn act -> act.action == "company_adding" end)
      refute Enum.find(res.activities, fn act -> act.action == "space_added" end)
      assert Enum.find(res.activities, fn act -> act.action == "goal_created" end)
      refute Enum.find(res.activities, fn act -> act.action == "project_created" end)
      refute Enum.find(res.activities, fn act -> act.action == "project_milestone_creation" end)
      refute Enum.find(res.activities, fn act -> act.action == "task_adding" end)
    end

    test "milestone scope includes only milestone activities", ctx do
      assert {200, res} =
               query(ctx.conn, :get_activities, %{
                 scope_type: :milestone,
                 scope_id: Paths.milestone_id(ctx.milestone),
                 actions: []
               })

      refute Enum.find(res.activities, fn act -> act.action == "company_adding" end)
      refute Enum.find(res.activities, fn act -> act.action == "space_added" end)
      refute Enum.find(res.activities, fn act -> act.action == "goal_created" end)
      refute Enum.find(res.activities, fn act -> act.action == "project_created" end)
      assert Enum.find(res.activities, fn act -> act.action == "project_milestone_creation" end)
      assert Enum.find(res.activities, fn act -> act.action == "task_adding" end)
    end

    test "task scope includes only task activities", ctx do
      assert {200, res} =
               query(ctx.conn, :get_activities, %{
                 scope_type: :task,
                 scope_id: Paths.task_id(ctx.task),
                 actions: []
               })

      refute Enum.find(res.activities, fn act -> act.action == "company_adding" end)
      refute Enum.find(res.activities, fn act -> act.action == "space_added" end)
      refute Enum.find(res.activities, fn act -> act.action == "goal_created" end)
      refute Enum.find(res.activities, fn act -> act.action == "project_created" end)
      refute Enum.find(res.activities, fn act -> act.action == "project_milestone_creation" end)
      assert Enum.find(res.activities, fn act -> act.action == "task_adding" end)
    end
  end

  defp create_milestone(ctx) do
    ctx =
      ctx
      |> Factory.preload(:project, :access_context)
      |> Factory.add_project_milestone(:milestone, :project)

    attrs = %{
      action: "project_milestone_creation",
      author_id: ctx.creator.id,
      access_context_id: ctx.project.access_context.id,
      content: %{
        "company_id" => ctx.company.id,
        "space_id" => ctx.space.id,
        "project_id" => ctx.project.id,
        "milestone_id" => ctx.milestone.id,
        "milestone_name" => ctx.milestone.title
      }
    }

    {:ok, _} = Repo.insert(struct(Activity, attrs))

    ctx
  end

  defp create_task(ctx) do
    ctx = Factory.add_project_task(ctx, :task, :milestone)

    attrs = %{
      action: "task_adding",
      author_id: ctx.creator.id,
      access_context_id: ctx.project.access_context.id,
      content: %{
        "company_id" => ctx.company.id,
        "space_id" => ctx.space.id,
        "project_id" => ctx.project.id,
        "milestone_id" => ctx.milestone.id,
        "task_id" => ctx.task.id,
        "name" => ctx.task.name
      }
    }

    {:ok, _} = Repo.insert(struct(Activity, attrs))

    ctx
  end
end
