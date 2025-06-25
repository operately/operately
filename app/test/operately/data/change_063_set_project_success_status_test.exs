defmodule Operately.Data.Change063SetProjectSuccessStatusTest do
  use Operately.DataCase
  import Operately.ProjectsFixtures

  alias Operately.Repo

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> setup_test_projects()
  end

  test "sets success_status for closed projects", ctx do
    Operately.Data.Change063SetProjectSuccessStatus.run()

    closed_project = Repo.reload(ctx.closed_project)
    open_project = Repo.reload(ctx.open_project)

    assert closed_project.success_status == :achieved
    assert open_project.success_status == nil
  end

  defp setup_test_projects(ctx) do
    closed_project = project_fixture(%{creator_id: ctx.creator.id, group_id: ctx.space.id, company_id: ctx.company.id})
    set_project_attributes(closed_project.id, closed_at: ~U[2025-06-01 10:00:00Z])

    open_project = project_fixture(%{creator_id: ctx.creator.id, group_id: ctx.space.id, company_id: ctx.company.id})

    ctx
    |> Map.put(:closed_project, closed_project)
    |> Map.put(:open_project, open_project)
  end

  defp set_project_attributes(project_id, attrs) do
    project_id = Ecto.UUID.dump!(project_id)

    Enum.each(attrs, fn {field, value} ->
      update_sql = "UPDATE projects SET #{field} = $1 WHERE id = $2"
      Repo.query!(update_sql, [value, project_id])
    end)
  end
end
