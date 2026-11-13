defmodule OperatelyWeb.Mcp.Tools.Kpis.EditKpiEntryTest do
  use Operately.DataCase, async: true

  import Operately.KpisFixtures
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Kpis.EditKpiEntry
  alias OperatelyWeb.Mcp.ToolConnHelper

  setup do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space)
    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    entry = kpi_entry_fixture(ctx.creator, kpi)
    Map.merge(ctx, %{kpi: kpi, entry: entry})
  end

  test "adapts inputs and returns the API result", ctx do
    assert {:ok, %{entry: entry}} = EditKpiEntry.call(ToolConnHelper.conn(ctx), %{"entry_id" => Operately.ShortUuid.encode!(ctx.entry.id), "value" => 75.5})
    assert entry.value == 75.5
    assert entry.period == "2026-01-01"
  end

  test "rejects malformed identifiers", ctx do
    arguments = %{"entry_id" => Operately.ShortUuid.encode!(ctx.entry.id), "value" => 75.5} |> Map.put("entry_id", "invalid-%%")
    assert {:error, :invalid_arguments} = EditKpiEntry.call(ToolConnHelper.conn(ctx), arguments)
  end

  test "does not expose another company's resource", ctx do
    other = %{} |> Factory.setup()
    assert {:error, :not_found} = EditKpiEntry.call(ToolConnHelper.conn(other), %{"entry_id" => Operately.ShortUuid.encode!(ctx.entry.id), "value" => 75.5})
  end
end
