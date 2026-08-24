defmodule Operately.Operations.KpiCreationTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Kpis
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    champion = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(creator)

    attrs = %{
      space_id: space.id,
      champion_id: champion.id,
      name: "Customer satisfaction",
      description: %{"type" => "doc", "content" => [%{"type" => "paragraph"}]},
      unit: "%",
      cadence: :monthly
    }

    {:ok, company: company, creator: creator, champion: champion, space: space, attrs: attrs}
  end

  test "creates a KPI with the correct fields", ctx do
    {:ok, kpi} = Kpis.create_kpi(ctx.creator, ctx.attrs)

    assert kpi.space_id == ctx.space.id
    assert kpi.champion_id == ctx.champion.id
    assert kpi.name == "Customer satisfaction"
    assert kpi.description == ctx.attrs.description
    assert kpi.unit == "%"
    assert kpi.cadence == :monthly
    assert kpi.subscription_list_id

    assert Enum.map(Kpis.list_kpis(ctx.space.id), & &1.id) == [kpi.id]
  end

  test "subscribes the creator and champion", ctx do
    {:ok, kpi} = Kpis.create_kpi(ctx.creator, ctx.attrs)

    assert {:ok, subscription_list} =
             Operately.Notifications.SubscriptionList.get(:system, id: kpi.subscription_list_id)

    assert subscription_list.parent_id == kpi.id
    assert subscription_list.parent_type == :kpi

    assert {:ok, creator_subscription} =
             Operately.Notifications.Subscription.get(:system,
               subscription_list_id: kpi.subscription_list_id,
               person_id: ctx.creator.id
             )

    assert creator_subscription.type == :joined
    refute creator_subscription.canceled

    assert {:ok, champion_subscription} =
             Operately.Notifications.Subscription.get(:system,
               subscription_list_id: kpi.subscription_list_id,
               person_id: ctx.champion.id
             )

    assert champion_subscription.type == :invited
    refute champion_subscription.canceled
  end

  test "records a kpi_created activity", ctx do
    {:ok, kpi} = Kpis.create_kpi(ctx.creator, ctx.attrs)

    activity =
      from(a in Activity, where: a.action == "kpi_created" and a.content["kpi_id"] == ^kpi.id)
      |> Repo.one()

    assert activity
    assert activity.author_id == ctx.creator.id
    assert activity.content["space_id"] == ctx.space.id
    assert activity.access_context_id
  end

  test "any space member (not only the champion) can create a KPI", ctx do
    member = person_fixture_with_account(%{company_id: ctx.company.id})
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: member.id, access_level: 70}])

    attrs = Map.put(ctx.attrs, :champion_id, ctx.champion.id)
    {:ok, kpi} = Kpis.create_kpi(member, attrs)

    assert kpi.champion_id == ctx.champion.id
    refute member.id == kpi.champion_id
  end

  test "fails validation when required fields are missing", ctx do
    assert {:error, :kpi, changeset, _} = Kpis.create_kpi(ctx.creator, Map.delete(ctx.attrs, :name))
    assert %{name: ["can't be blank"]} = errors_on(changeset)
  end

  test "notifies space members other than the author", ctx do
    member = person_fixture_with_account(%{company_id: ctx.company.id})
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: member.id, access_level: 70}])

    {:ok, kpi} =
      Oban.Testing.with_testing_mode(:manual, fn ->
        Kpis.create_kpi(ctx.creator, ctx.attrs)
      end)

    activity =
      from(a in Activity, where: a.action == "kpi_created" and a.content["kpi_id"] == ^kpi.id)
      |> Repo.one()

    perform_job(activity.id)

    notified_ids = activity.id |> fetch_notifications() |> Enum.map(& &1.person_id)

    assert member.id in notified_ids
    refute ctx.creator.id in notified_ids
  end
end
