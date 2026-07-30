defmodule Operately.Operations.AddKpiDataPointTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  alias Operately.Operations.{CreateKpi, AddKpiDataPoint}

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:editor, :space, permissions: :edit_access)
      |> Factory.add_space_member(:viewer, :space, permissions: :view_access)

    {:ok, kpi} = CreateKpi.run(ctx.creator, ctx.space, %{name: "Revenue"})
    Map.put(ctx, :kpi, kpi)
  end

  test "adds a data point to the KPI", ctx do
    {:ok, dp} = AddKpiDataPoint.run(ctx.creator, ctx.kpi, %{value: 42.0, recorded_for: ~D[2026-01-01]})

    assert dp.kpi_id == ctx.kpi.id
    assert dp.value == 42.0
    assert dp.recorded_for == ~D[2026-01-01]
  end

  test "records an activity and notifies space members", ctx do
    activity =
      Oban.Testing.with_testing_mode(:manual, fn ->
        {:ok, _} = AddKpiDataPoint.run(ctx.creator, ctx.kpi, %{value: 42.0, recorded_for: ~D[2026-01-01]})
        Repo.get_by!(Operately.Activities.Activity, action: "kpi_data_point_adding")
      end)

    assert activity.content["kpi_name"] == "Revenue"

    perform_job(activity.id)
    notifications = fetch_notifications(activity.id, action: "kpi_data_point_adding")

    recipient_ids = Enum.map(notifications, & &1.person_id)
    assert ctx.editor.id in recipient_ids
    assert ctx.viewer.id in recipient_ids
    refute ctx.creator.id in recipient_ids
  end

  test "rejects a duplicate data point for the same date", ctx do
    {:ok, _} = AddKpiDataPoint.run(ctx.creator, ctx.kpi, %{value: 1.0, recorded_for: ~D[2026-01-01]})

    assert {:error, changeset} =
             AddKpiDataPoint.run(ctx.creator, ctx.kpi, %{value: 2.0, recorded_for: ~D[2026-01-01]})

    assert "a data point already exists for this date" in errors_on(changeset).kpi_id
  end

  test "rejects a person without edit access", ctx do
    assert {:error, :forbidden} =
             AddKpiDataPoint.run(ctx.viewer, ctx.kpi, %{value: 1.0, recorded_for: ~D[2026-01-01]})
  end
end
