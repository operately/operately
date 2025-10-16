defmodule Operately.Data.Change058UpdateProjectsLastCheckInStatusTest do
  use Operately.DataCase

  alias Operately.Repo

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  test "updates 'issue' status to 'off_track'", ctx do
    projects = create_projects_with_statuses(ctx, ["on_track", "caution", "issue", "issue", "on_track", "caution", "at_risk"])

    Operately.Data.Change058UpdateProjectsLastCheckInStatus.run()

    updated_projects = reload_projects(projects)

    assert_statuses(updated_projects, [
      :on_track,
      :caution,
      :off_track,
      :off_track,
      :on_track,
      :caution,
      :off_track
    ])
  end

  test "raises error when unexpected statuses exist", ctx do
    _projects = create_projects_with_statuses(ctx, ["on_track", "caution", "issue", "invalid_status"])

    assert_raise RuntimeError, ~r/Found unexpected project last_check_in_status values: invalid_status/, fn ->
      Operately.Data.Change058UpdateProjectsLastCheckInStatus.run()
    end
  end

  #
  # Helpers
  #

  defp create_projects_with_statuses(ctx, statuses) do
    projects =
      Enum.map(statuses, fn status ->
        insert_project_with_status(ctx, status)
      end)

    projects
  end

  defp assert_statuses(projects, expected_statuses) do
    actual_statuses = Enum.map(projects, & &1.last_check_in_status)
    assert actual_statuses == expected_statuses
  end

  defp reload_projects(projects) do
    Enum.map(projects, &Repo.reload/1)
  end

  defp insert_project_with_status(ctx, status) do
    project =
      Operately.ProjectsFixtures.project_fixture(
        company_id: ctx.company.id,
        creator_id: ctx.creator.id,
        group_id: ctx.space.id
      )

    # Update its status directly via SQL to bypass validations
    project_id = Ecto.UUID.dump!(project.id)

    update_sql = """
    UPDATE projects
    SET last_check_in_status = $1
    WHERE id = $2
    """

    Repo.query!(update_sql, [status, project_id])

    %{project | last_check_in_status: status}
  end
end
