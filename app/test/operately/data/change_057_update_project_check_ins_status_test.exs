defmodule Operately.Data.Change057UpdateProjectCheckInsStatusTest do
  use Operately.DataCase

  alias Operately.Repo

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
  end

  test "updates 'issue' status to 'off_track'", ctx do
    check_ins = create_check_ins_with_statuses(ctx, ["on_track", "caution", "issue", "issue", "on_track", "caution", "at_risk"])

    Operately.Data.Change057UpdateProjectCheckInsStatus.run()

    updated_check_ins = reload_check_ins(check_ins)

    assert_statuses(updated_check_ins, [
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
    _check_ins = create_check_ins_with_statuses(ctx, ["on_track", "caution", "issue", "invalid_status"])

    assert_raise RuntimeError, ~r/Found unexpected project check-in statuses: invalid_status/, fn ->
      Operately.Data.Change057UpdateProjectCheckInsStatus.run()
    end
  end

  #
  # Helpers
  #

  defp create_check_ins_with_statuses(ctx, statuses) do
    check_ins =
      Enum.map(statuses, fn status ->
        insert_project_check_in(ctx, status)
      end)

    check_ins
  end

  defp assert_statuses(check_ins, expected_statuses) do
    actual_statuses = Enum.map(check_ins, & &1.status)
    assert actual_statuses == expected_statuses
  end

  defp reload_check_ins(check_ins) do
    Enum.map(check_ins, &Repo.reload/1)
  end

  defp insert_project_check_in(ctx, status) do
    check_in =
      Operately.ProjectsFixtures.check_in_fixture(%{
        author_id: ctx.creator.id,
        project_id: ctx.project.id
      })

    # Update its status directly via SQL to bypass validations
    check_in_id = Ecto.UUID.dump!(check_in.id)

    update_sql = """
    UPDATE project_check_ins
    SET status = $1
    WHERE id = $2
    """

    Repo.query!(update_sql, [status, check_in_id])

    %{check_in | status: status}
  end
end
