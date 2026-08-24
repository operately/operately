defmodule Operately.Operations.KpiEditingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.KpisFixtures

  alias Operately.Kpis
  alias Operately.Activities.Activity
  alias Operately.Notifications

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    champion = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(creator)
    {:ok, _} = Operately.Groups.add_members(creator, space.id, [%{id: champion.id, access_level: 70}])
    kpi = kpi_fixture(creator, %{space_id: space.id, champion_id: champion.id, name: "Old name"})

    {:ok, company: company, creator: creator, champion: champion, space: space, kpi: kpi}
  end

  test "updates the KPI and records an activity", ctx do
    description = %{"type" => "doc", "content" => [%{"type" => "paragraph"}]}
    {:ok, kpi} = Kpis.edit_kpi(ctx.creator, ctx.kpi, %{name: "New name", unit: "points", description: description})

    assert kpi.name == "New name"
    assert kpi.unit == "points"
    assert kpi.description == description
    assert Kpis.get_kpi(ctx.kpi.id).name == "New name"
    assert Kpis.get_kpi(ctx.kpi.id).description == description

    activity =
      from(a in Activity, where: a.action == "kpi_edited" and a.content["kpi_id"] == ^kpi.id)
      |> Repo.one()

    assert activity.content["old_name"] == "Old name"
    assert activity.content["new_name"] == "New name"
  end

  test "subscribes a newly assigned champion", ctx do
    new_champion = person_fixture_with_account(%{company_id: ctx.company.id})
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: new_champion.id, access_level: 70}])

    {:ok, kpi} = Kpis.edit_kpi(ctx.creator, ctx.kpi, %{champion_id: new_champion.id})

    assert {:ok, subscription} =
             Notifications.Subscription.get(:system,
               subscription_list_id: kpi.subscription_list_id,
               person_id: new_champion.id
             )

    refute subscription.canceled
  end

  test "notifies subscribers other than the author", ctx do
    {:ok, kpi} =
      Oban.Testing.with_testing_mode(:manual, fn ->
        Kpis.edit_kpi(ctx.creator, ctx.kpi, %{name: "New name"})
      end)

    activity =
      from(a in Activity, where: a.action == "kpi_edited" and a.content["kpi_id"] == ^kpi.id)
      |> Repo.one()

    perform_job(activity.id)

    notified_ids = activity.id |> fetch_notifications() |> Enum.map(& &1.person_id)

    assert ctx.champion.id in notified_ids
    refute ctx.creator.id in notified_ids
  end
end
