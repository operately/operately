defmodule Operately.Kpis.KpiEntryTest do
  use Operately.DataCase

  import Operately.KpisFixtures

  alias Operately.Access.Binding
  alias Operately.Kpis.KpiEntry
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:member, :space)
    |> Factory.add_company_member(:outsider)
  end

  test "get/2 loads an entry for a space member and denies outsiders", ctx do
    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    entry = kpi_entry_fixture(ctx.creator, kpi)

    assert {:ok, loaded} = KpiEntry.get(ctx.member, id: entry.id)
    assert loaded.id == entry.id
    assert loaded.request_info.access_level >= Binding.view_access()

    assert {:error, :not_found} = KpiEntry.get(ctx.outsider, id: entry.id)
  end
end
