defmodule Operately.Operations.KpiEntryEditingTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.KpisFixtures

  alias Operately.Kpis
  alias Operately.Kpis.KpiEntryEdit
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(creator)
    kpi = kpi_fixture(creator, %{space_id: space.id})
    entry = kpi_entry_fixture(creator, kpi, %{value: 40.0, period: ~D[2026-01-01]})

    {:ok, creator: creator, space: space, kpi: kpi, entry: entry}
  end

  test "updates the logged value and keeps the previous value", ctx do
    {:ok, entry} = Kpis.edit_entry(ctx.creator, ctx.kpi, ctx.entry, %{value: 42.0})

    assert entry.value == 42.0
    assert entry.period == ~D[2026-01-01]
    assert entry.recorded_by_id == ctx.creator.id

    [edit] = Repo.all(from(e in KpiEntryEdit, where: e.kpi_entry_id == ^entry.id))
    assert edit.previous_value == 40.0
    assert edit.previous_period == ~D[2026-01-01]
    assert edit.edited_by_id == ctx.creator.id
  end

  test "updates the period and keeps the previous period", ctx do
    {:ok, entry} = Kpis.edit_entry(ctx.creator, ctx.kpi, ctx.entry, %{period: ~D[2026-01-15]})

    assert entry.value == 40.0
    assert entry.period == ~D[2026-01-15]

    [edit] = Repo.all(from(e in KpiEntryEdit, where: e.kpi_entry_id == ^entry.id))
    assert edit.previous_period == ~D[2026-01-01]
  end

  test "does nothing when the value and period are unchanged", ctx do
    {:ok, entry} = Kpis.edit_entry(ctx.creator, ctx.kpi, ctx.entry, %{value: 40.0, period: ~D[2026-01-01]})

    assert entry.value == 40.0
    assert Repo.all(from(e in KpiEntryEdit, where: e.kpi_entry_id == ^entry.id)) == []
    refute Repo.one(from(a in Activity, where: a.action == "kpi_entry_edited" and a.content["entry_id"] == ^entry.id))
  end

  test "records the value it actually replaced when the caller's entry is stale", ctx do
    {:ok, _} = Kpis.edit_entry(ctx.creator, ctx.kpi, ctx.entry, %{value: 41.0})

    # ctx.entry still carries the original 40.0, as an overlapping request would.
    {:ok, entry} = Kpis.edit_entry(ctx.creator, ctx.kpi, ctx.entry, %{value: 42.0})

    assert entry.value == 42.0

    previous_values =
      from(e in KpiEntryEdit, where: e.kpi_entry_id == ^entry.id, order_by: e.previous_value)
      |> Repo.all()
      |> Enum.map(& &1.previous_value)

    assert previous_values == [40.0, 41.0]
  end

  test "records a kpi_entry_edited activity", ctx do
    {:ok, entry} = Kpis.edit_entry(ctx.creator, ctx.kpi, ctx.entry, %{value: 42.0})

    activity =
      from(a in Activity, where: a.action == "kpi_entry_edited" and a.content["entry_id"] == ^entry.id)
      |> Repo.one()

    assert activity
    assert activity.content["old_value"] == 40.0
    assert activity.content["new_value"] == 42.0
    assert activity.access_context_id
  end
end
