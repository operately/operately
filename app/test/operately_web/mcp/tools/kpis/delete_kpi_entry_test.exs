defmodule OperatelyWeb.Mcp.Tools.Kpis.DeleteKpiEntryTest do
  use Operately.DataCase, async: true

  import Operately.KpisFixtures
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Kpis.DeleteKpiEntry
  alias OperatelyWeb.Mcp.ToolConnHelper

  setup do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space)
    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    entry = kpi_entry_fixture(ctx.creator, kpi)
    Map.merge(ctx, %{kpi: kpi, entry: entry})
  end

  test "adapts inputs and returns the API result", ctx do
    assert {:ok, %{entry: _entry}} = DeleteKpiEntry.call(ToolConnHelper.conn(ctx), %{"entry_id" => Operately.ShortUuid.encode!(ctx.entry.id)})
    assert Operately.Kpis.list_entries(ctx.kpi.id) == []
  end

  test "rejects malformed identifiers", ctx do
    arguments = %{"entry_id" => Operately.ShortUuid.encode!(ctx.entry.id)} |> Map.put("entry_id", "invalid-%%")
    assert {:error, :invalid_arguments} = DeleteKpiEntry.call(ToolConnHelper.conn(ctx), arguments)
  end

  test "does not expose another company's resource", ctx do
    other = %{} |> Factory.setup()
    assert {:error, :not_found} = DeleteKpiEntry.call(ToolConnHelper.conn(other), %{"entry_id" => Operately.ShortUuid.encode!(ctx.entry.id)})
  end
end
