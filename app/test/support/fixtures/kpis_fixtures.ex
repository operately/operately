defmodule Operately.KpisFixtures do
  @moduledoc """
  Test helpers for creating KPI entities via the `Operately.Kpis` context.
  """

  alias Operately.Kpis

  def kpi_fixture(creator, attrs \\ %{}) do
    attrs =
      Enum.into(attrs, %{
        space_id: attrs[:space_id],
        champion_id: attrs[:champion_id] || creator.id,
        name: "Customer satisfaction",
        unit: "%",
        cadence: :monthly
      })

    {:ok, kpi} = Kpis.create_kpi(creator, attrs)
    kpi
  end

  def kpi_entry_fixture(author, kpi, attrs \\ %{}) do
    attrs =
      Enum.into(attrs, %{
        value: 42.0,
        period: ~D[2026-01-01],
        recorded_by_id: author.id
      })

    {:ok, entry} = Kpis.log_entry(author, kpi, attrs)
    entry
  end

  def kpi_annotation_fixture(author, kpi, attrs \\ %{}) do
    attrs =
      Enum.into(attrs, %{
        title: "Launched enterprise plan",
        date: ~D[2026-03-15],
        description: nil,
        created_by_id: author.id
      })

    {:ok, annotation} = Kpis.add_annotation(author, kpi, attrs)
    annotation
  end
end
