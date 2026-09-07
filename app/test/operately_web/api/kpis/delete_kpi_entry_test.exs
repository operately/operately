defmodule OperatelyWeb.Api.Kpis.DeleteKpiEntryTest do
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures

  alias Operately.Kpis

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:kpis, :delete_kpi_entry], %{})
    end
  end

  describe "delete_kpi_entry" do
    setup ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_space_member(:member, :space)
        |> Factory.add_company_member(:outsider)

      kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
      entry = kpi_entry_fixture(ctx.creator, kpi)

      ctx
      |> Map.put(:kpi, kpi)
      |> Map.put(:entry, entry)
    end

    test "any space member with edit access can delete an entry", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      inputs = %{entry_id: Paths.kpi_entry_id(ctx.entry)}
      assert {200, res} = mutation(ctx.conn, [:kpis, :delete_kpi_entry], inputs)
      assert res.entry.id == Paths.kpi_entry_id(ctx.entry)
      assert Kpis.get_entry(ctx.entry.id) == nil
    end

    test "a non-space-member cannot delete an entry", ctx do
      ctx = Factory.log_in_person(ctx, :outsider)

      inputs = %{entry_id: Paths.kpi_entry_id(ctx.entry)}
      assert {404, _} = mutation(ctx.conn, [:kpis, :delete_kpi_entry], inputs)
      assert Kpis.get_entry(ctx.entry.id)
    end
  end
end
