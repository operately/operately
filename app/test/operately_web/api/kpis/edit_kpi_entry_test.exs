defmodule OperatelyWeb.Api.Kpis.EditKpiEntryTest do
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures

  alias Operately.Kpis

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:kpis, :edit_kpi_entry], %{})
    end
  end

  describe "edit_kpi_entry" do
    setup ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_space_member(:member, :space)
        |> Factory.add_company_member(:outsider)

      kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
      entry = kpi_entry_fixture(ctx.creator, kpi, value: 40.0, period: ~D[2026-01-01])
      ctx |> Map.put(:kpi, kpi) |> Map.put(:entry, entry)
    end

    test "any space member can edit a logged value", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      inputs = %{entry_id: Paths.kpi_entry_id(ctx.entry), value: 42.0}
      assert {200, res} = mutation(ctx.conn, [:kpis, :edit_kpi_entry], inputs)

      assert res.entry.value == 42.0
      assert res.entry.period == "2026-01-01"
      assert [edit] = res.entry.edits
      assert edit.previous_value == 40.0
      assert edit.previous_period == "2026-01-01"
      assert edit.edited_by.id == Paths.person_id(ctx.member)

      loaded = Kpis.get_entry(ctx.entry.id)
      assert loaded.value == 42.0
    end

    test "returns the previous values on the KPI detail payload", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      assert {200, _} = mutation(ctx.conn, [:kpis, :edit_kpi_entry], %{entry_id: Paths.kpi_entry_id(ctx.entry), value: 42.0})
      assert {200, res} = query(ctx.conn, [:kpis, :get_kpi], %{kpi_id: Paths.kpi_id(ctx.kpi)})

      [entry] = res.kpi.entries
      assert entry.value == 42.0
      assert [edit] = entry.edits
      assert edit.previous_value == 40.0
    end

    test "a non-space-member cannot edit a logged value", ctx do
      ctx = Factory.log_in_person(ctx, :outsider)

      inputs = %{entry_id: Paths.kpi_entry_id(ctx.entry), value: 42.0}
      assert {404, _} = mutation(ctx.conn, [:kpis, :edit_kpi_entry], inputs)
      assert Kpis.get_entry(ctx.entry.id).value == 40.0
    end
  end
end
