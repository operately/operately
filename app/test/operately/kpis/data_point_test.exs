defmodule Operately.Kpis.DataPointTest do
  use Operately.DataCase

  alias Operately.Kpis.DataPoint

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> then(fn ctx ->
      {:ok, kpi} = Operately.Operations.CreateKpi.run(ctx.creator, ctx.space, %{name: "Revenue"})
      Map.put(ctx, :kpi, kpi)
    end)
  end

  test "requires kpi_id, value and recorded_for" do
    changeset = DataPoint.changeset(%{})

    refute changeset.valid?
    assert %{kpi_id: _, value: _, recorded_for: _} = errors_on(changeset)
  end

  test "rejects duplicate data points for the same (kpi_id, recorded_for)", ctx do
    attrs = %{kpi_id: ctx.kpi.id, value: 10.0, recorded_for: ~D[2026-01-01]}

    assert {:ok, _} = DataPoint.changeset(attrs) |> Repo.insert()

    assert {:error, changeset} = DataPoint.changeset(%{attrs | value: 20.0}) |> Repo.insert()
    assert "a data point already exists for this date" in errors_on(changeset).kpi_id
  end
end
