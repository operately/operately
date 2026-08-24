defmodule Operately.Operations.KpiEntryLoggingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.KpisFixtures

  alias Operately.Kpis
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    champion = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(creator)
    {:ok, _} = Operately.Groups.add_members(creator, space.id, [%{id: champion.id, access_level: 70}])
    kpi = kpi_fixture(creator, %{space_id: space.id, champion_id: champion.id})

    {:ok, company: company, creator: creator, champion: champion, space: space, kpi: kpi}
  end

  test "appends an entry to the KPI history", ctx do
    {:ok, entry} =
      Kpis.log_entry(ctx.creator, ctx.kpi, %{value: 10.0, period: ~D[2026-01-01], recorded_by_id: ctx.creator.id})

    assert entry.kpi_id == ctx.kpi.id
    assert entry.value == 10.0
    assert entry.period == ~D[2026-01-01]
    assert entry.recorded_by_id == ctx.creator.id

    kpi_entry_fixture(ctx.creator, ctx.kpi, %{value: 20.0, period: ~D[2026-02-01]})

    assert length(Kpis.list_entries(ctx.kpi.id)) == 2
  end

  test "records a kpi_entry_logged activity", ctx do
    {:ok, entry} =
      Kpis.log_entry(ctx.creator, ctx.kpi, %{value: 10.0, period: ~D[2026-01-01], recorded_by_id: ctx.creator.id})

    activity =
      from(a in Activity, where: a.action == "kpi_entry_logged" and a.content["entry_id"] == ^entry.id)
      |> Repo.one()

    assert activity
    assert activity.content["kpi_id"] == ctx.kpi.id
    assert activity.access_context_id
  end

  test "any space member can log an entry", ctx do
    member = person_fixture_with_account(%{company_id: ctx.company.id})
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: member.id, access_level: 70}])

    {:ok, entry} =
      Kpis.log_entry(member, ctx.kpi, %{value: 5.0, period: ~D[2026-01-01], recorded_by_id: member.id})

    assert entry.recorded_by_id == member.id
  end

  test "notifies the KPI champion", ctx do
    {:ok, entry} =
      Oban.Testing.with_testing_mode(:manual, fn ->
        Kpis.log_entry(ctx.creator, ctx.kpi, %{value: 10.0, period: ~D[2026-01-01], recorded_by_id: ctx.creator.id})
      end)

    activity =
      from(a in Activity, where: a.action == "kpi_entry_logged" and a.content["entry_id"] == ^entry.id)
      |> Repo.one()

    perform_job(activity.id)

    notified_ids = activity.id |> fetch_notifications() |> Enum.map(& &1.person_id)

    assert ctx.champion.id in notified_ids
  end

  test "fails validation when value is missing", ctx do
    assert {:error, :entry, changeset, _} =
             Kpis.log_entry(ctx.creator, ctx.kpi, %{period: ~D[2026-01-01], recorded_by_id: ctx.creator.id})

    assert %{value: ["can't be blank"]} = errors_on(changeset)
  end
end
