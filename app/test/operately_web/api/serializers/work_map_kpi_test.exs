defmodule OperatelyWeb.Api.Serializers.WorkMapKpiTest do
  use ExUnit.Case, async: true

  alias Operately.Groups.Group
  alias Operately.Kpis.{Kpi, KpiEntry}
  alias Operately.WorkMaps.WorkMapKpi
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Paths

  test "serializes the space and the loaded readings" do
    space = %Group{id: Ecto.UUID.generate(), name: "Product"}

    kpi = %Kpi{
      id: Ecto.UUID.generate(),
      name: "Weekly active teams",
      unit: "teams",
      cadence: :weekly,
      space: space,
      entries: [
        %KpiEntry{value: 10.0, period: ~D[2026-11-09]},
        %KpiEntry{value: 0.0, period: ~D[2026-11-16]}
      ],
      latest_entry: %KpiEntry{value: 0.0, period: ~D[2026-11-16]}
    }

    assert Serializer.serialize(WorkMapKpi.from_kpi(kpi)) == %{
             __typename: "work_map_kpi",
             id: Paths.kpi_id(kpi),
             name: "Weekly active teams",
             unit: "teams",
             cadence: :weekly,
             space_id: Paths.space_id(space),
             space_name: "Product",
             recent_values: [10.0, 0.0],
             period: "2026-11-16",
             value: 0.0
           }
  end

  test "from_kpi converts each KPI in a list and keeps the order" do
    kpis = [
      kpi("Revenue", "USD", :monthly),
      kpi("Run time", "s", :weekly)
    ]

    assert Enum.map(WorkMapKpi.from_kpi(kpis), & &1.name) == ["Revenue", "Run time"]
  end

  test "a KPI with no readings has an empty series and no latest value" do
    kpi = %Kpi{
      id: Ecto.UUID.generate(),
      name: "Revenue",
      unit: "USD",
      cadence: :monthly,
      space: %Group{id: Ecto.UUID.generate(), name: "Growth"},
      entries: %Ecto.Association.NotLoaded{},
      latest_entry: nil
    }

    serialized = Serializer.serialize(WorkMapKpi.from_kpi(kpi))

    assert serialized.recent_values == []
    assert serialized.period == nil
    assert serialized.value == nil
  end

  defp kpi(name, unit, cadence) do
    %Kpi{
      id: Ecto.UUID.generate(),
      name: name,
      unit: unit,
      cadence: cadence,
      space: %Group{id: Ecto.UUID.generate(), name: "Product"},
      entries: [],
      latest_entry: nil
    }
  end
end
