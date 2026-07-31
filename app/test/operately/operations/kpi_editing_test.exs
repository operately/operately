defmodule Operately.Operations.KpiEditingTest do
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
    kpi = kpi_fixture(creator, %{space_id: space.id, name: "Old name"})

    {:ok, creator: creator, space: space, kpi: kpi}
  end

  test "updates the KPI and records an activity", ctx do
    {:ok, kpi} = Kpis.edit_kpi(ctx.creator, ctx.kpi, %{name: "New name", unit: "points"})

    assert kpi.name == "New name"
    assert kpi.unit == "points"
    assert Kpis.get_kpi(ctx.kpi.id).name == "New name"

    activity =
      from(a in Activity, where: a.action == "kpi_edited" and a.content["kpi_id"] == ^kpi.id)
      |> Repo.one()

    assert activity.content["old_name"] == "Old name"
    assert activity.content["new_name"] == "New name"
  end
end
