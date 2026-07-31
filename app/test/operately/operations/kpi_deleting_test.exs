defmodule Operately.Operations.KpiDeletingTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.KpisFixtures

  alias Operately.Kpis
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(creator)
    kpi = kpi_fixture(creator, %{space_id: space.id})

    {:ok, creator: creator, space: space, kpi: kpi}
  end

  test "removes the KPI and records an activity", ctx do
    {:ok, _} = Kpis.delete_kpi(ctx.creator, ctx.kpi)

    assert Kpis.get_kpi(ctx.kpi.id) == nil
    assert Kpis.list_kpis(ctx.space.id) == []

    activity =
      from(a in Activity, where: a.action == "kpi_deleted" and a.content["kpi_id"] == ^ctx.kpi.id)
      |> Repo.one()

    assert activity
  end
end
