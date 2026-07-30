defmodule Operately.Support.Factory.Kpis do
  def add_kpi(ctx, testid, space_name, opts \\ []) do
    space = Map.fetch!(ctx, space_name)

    attrs =
      opts
      |> Enum.into(%{name: "Revenue", unit: "currency"})

    {:ok, kpi} = Operately.Operations.KpiCreating.run(space, attrs)

    Map.put(ctx, testid, kpi)
  end

  def add_kpi_data_point(ctx, testid, kpi_name, opts \\ []) do
    kpi = Map.fetch!(ctx, kpi_name)

    attrs =
      opts
      |> Enum.into(%{value: 100.0, recorded_for: Date.utc_today()})

    {:ok, data_point} = Operately.Operations.KpiDataPointAdding.run(kpi, attrs)

    Map.put(ctx, testid, data_point)
  end
end
