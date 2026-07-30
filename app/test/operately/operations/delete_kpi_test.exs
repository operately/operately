defmodule Operately.Operations.DeleteKpiTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  alias Operately.Kpis.Kpi
  alias Operately.Operations.{CreateKpi, DeleteKpi}

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:viewer, :space, permissions: :view_access)

    {:ok, kpi} = CreateKpi.run(ctx.creator, ctx.space, %{name: "Revenue"})
    Map.put(ctx, :kpi, kpi)
  end

  test "deletes the KPI and records an activity", ctx do
    activity =
      Oban.Testing.with_testing_mode(:manual, fn ->
        {:ok, _} = DeleteKpi.run(ctx.creator, ctx.kpi)
        Repo.get_by!(Operately.Activities.Activity, action: "kpi_deleting")
      end)

    assert activity.content["name"] == "Revenue"
    refute Repo.get(Kpi, ctx.kpi.id)
  end

  test "rejects a person without edit access", ctx do
    assert {:error, :forbidden} = DeleteKpi.run(ctx.viewer, ctx.kpi)
    assert Repo.get(Kpi, ctx.kpi.id)
  end
end
