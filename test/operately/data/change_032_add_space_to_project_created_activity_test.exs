defmodule Operately.Data.Change032AddSpaceToProjectCreatedActivityTest do
  use Operately.DataCase

  alias Operately.Repo

  import Ecto.Query, only: [from: 2]
  import Operately.ProjectsFixtures

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  test "migration doesn't delete current data in activity content", ctx do
    projects = Enum.map(1..3, fn _ ->
      project_fixture(%{company_id: ctx.company.id, creator_id: ctx.creator.id, group_id: ctx.space.id})
    end)

    Operately.Data.Change032AddSpaceToProjectCreatedActivity.run()

    fetch_activities()
    |> Enum.each(fn activity ->
      assert activity.content["company_id"] == ctx.company.id
      assert activity.content["space_id"] == ctx.space.id
      assert Enum.find(projects, &(&1.id == activity.content["project_id"]))
    end)
  end

  #
  # Helpers
  #

  defp fetch_activities() do
    from(a in Operately.Activities.Activity,
      where: a.action == "project_created"
    )
    |> Repo.all()
  end
end
