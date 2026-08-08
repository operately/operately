defmodule Operately.Data.Change112CreateSubscriptionListsForKpisTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Operately.KpisFixtures

  alias Operately.Notifications.SubscriptionList
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:champion, :space)

    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id)
    kpi = reset_kpi_subscription_list(kpi)

    {:ok, Map.put(ctx, :kpi, kpi)}
  end

  test "creates subscription lists for existing KPIs", ctx do
    assert ctx.kpi.subscription_list_id == nil

    Operately.Data.Change112CreateSubscriptionListsForKpis.run()

    kpi = Repo.reload(ctx.kpi)

    assert kpi.subscription_list_id != nil
    assert {:ok, subscription_list} = SubscriptionList.get(:system, id: kpi.subscription_list_id)
    assert subscription_list.parent_id == kpi.id
    assert subscription_list.parent_type == :kpi
  end

  test "does not create duplicate subscription lists for KPIs that already have them", ctx do
    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id)
    assert kpi.subscription_list_id != nil

    Operately.Data.Change112CreateSubscriptionListsForKpis.run()

    reloaded = Repo.reload(kpi)
    assert reloaded.subscription_list_id == kpi.subscription_list_id

    subscription_lists =
      Repo.all(from(sl in SubscriptionList, where: sl.parent_id == ^kpi.id, where: sl.parent_type == :kpi))

    assert length(subscription_lists) == 1
  end

  defp reset_kpi_subscription_list(kpi) do
    Repo.update_all(
      from(k in Operately.Kpis.Kpi, where: k.id == ^kpi.id),
      set: [subscription_list_id: nil]
    )

    Repo.delete_all(from(sl in SubscriptionList, where: sl.parent_id == ^kpi.id, where: sl.parent_type == :kpi))

    Repo.reload(kpi)
  end
end
