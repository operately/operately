defmodule Operately.KpisFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Kpis` context.
  """

  @doc """
  Generate a kpi.
  """
  def kpi_fixture(attrs \\ %{}) do
    {:ok, kpi} =
      attrs
      |> Enum.into(%{
        danger_direction: :above,
        danger_threshold: 42,
        name: "some name",
        target: 42,
        target_direction: :above,
        unit: :currency,
        warning_direction: :above,
        warning_threshold: 42
      })
      |> Operately.Kpis.create_kpi()

    kpi
  end

  @doc """
  Generate a metric.
  """
  def metric_fixture(attrs \\ %{}) do
    {:ok, metric} =
      attrs
      |> Enum.into(%{
        date: ~N[2023-05-04 10:14:00],
        value: 42
      })
      |> Operately.Kpis.create_metric()

    metric
  end
end
