defmodule Operately.Data.Change036AddSpaceToProjectActivitiesTest do
  use Operately.DataCase
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  describe "migration doesn't delete existing data in activity content" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal1, :space)
      |> Factory.add_goal(:goal2, :space)
      |> Factory.add_project(:p1, :space, goal: :goal1)
      |> Factory.add_project(:p2, :space, goal: :goal1)
      |> Factory.add_project(:p3, :space, goal: :goal1)
    end

    test "project_archived", ctx do
      projects = [ctx.p1, ctx.p2, ctx.p3]

      Enum.each(projects, fn p ->
        {:ok, _} = Operately.Projects.archive_project(ctx.creator, p)
      end)

      Operately.Data.Change036AddSpaceToProjectActivities.run()

      fetch_activities("project_archived")
      |> Enum.each(fn activity ->
        assert activity.content["company_id"] == ctx.company.id
        assert activity.content["space_id"] == ctx.space.id
        assert Enum.find(projects, &(&1.id == activity.content["project_id"]))
      end)
    end

    test "project_goal_connection", ctx do
      projects = [ctx.p1, ctx.p2, ctx.p3]

      Enum.each(projects, fn p ->
        {:ok, _} = Operately.Operations.ProjectGoalConnection.run(ctx.creator, p, ctx.goal2)
      end)

      Operately.Data.Change036AddSpaceToProjectActivities.run()

      fetch_activities("project_goal_connection")
      |> Enum.each(fn activity ->
        assert activity.content["company_id"] == ctx.company.id
        assert activity.content["goal_id"] == ctx.goal2.id
        assert activity.content["space_id"] == ctx.space.id
        assert Enum.find(projects, &(&1.id == activity.content["project_id"]))
      end)
    end

    test "project_goal_disconnection", ctx do
      projects = [ctx.p1, ctx.p2, ctx.p3]

      Enum.each(projects, fn p ->
        {:ok, _} = Operately.Operations.ProjectGoalDisconnection.run(ctx.creator, p)
      end)

      Operately.Data.Change036AddSpaceToProjectActivities.run()

      fetch_activities("project_goal_disconnection")
      |> Enum.each(fn activity ->
        assert activity.content["company_id"] == ctx.company.id
        assert activity.content["goal_id"] == ctx.goal1.id
        assert activity.content["space_id"] == ctx.space.id
        assert Enum.find(projects, &(&1.id == activity.content["project_id"]))
      end)
    end
  end

  #
  # Helpers
  #

  defp fetch_activities(action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action
    )
    |> Repo.all()
  end
end
