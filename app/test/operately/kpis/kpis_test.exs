defmodule Operately.KpisTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.KpisFixtures

  alias Operately.Kpis

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(creator)

    {:ok, company: company, creator: creator, space: space}
  end

  test "list_kpis/1 returns only the KPIs of the given space", ctx do
    other_space = group_fixture(ctx.creator, %{name: "Other space"})

    kpi = kpi_fixture(ctx.creator, %{space_id: ctx.space.id})
    _other = kpi_fixture(ctx.creator, %{space_id: other_space.id})

    assert Enum.map(Kpis.list_kpis(ctx.space.id), & &1.id) == [kpi.id]
  end

  test "get_kpi/1 fetches a KPI by id", ctx do
    kpi = kpi_fixture(ctx.creator, %{space_id: ctx.space.id})

    assert Kpis.get_kpi(kpi.id).id == kpi.id
    assert Kpis.get_kpi(Ecto.UUID.generate()) == nil
  end

  test "list_entries/1 returns entries ordered by period", ctx do
    kpi = kpi_fixture(ctx.creator, %{space_id: ctx.space.id})

    kpi_entry_fixture(ctx.creator, kpi, %{period: ~D[2026-03-01], value: 3.0})
    kpi_entry_fixture(ctx.creator, kpi, %{period: ~D[2026-01-01], value: 1.0})
    kpi_entry_fixture(ctx.creator, kpi, %{period: ~D[2026-02-01], value: 2.0})

    periods = Kpis.list_entries(kpi.id) |> Enum.map(& &1.period)

    assert periods == [~D[2026-01-01], ~D[2026-02-01], ~D[2026-03-01]]
  end
end
