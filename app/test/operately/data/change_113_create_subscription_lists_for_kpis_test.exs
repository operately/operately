defmodule Operately.Data.Change113CreateSubscriptionListsForKpisTest do
  use Operately.DataCase

  import Operately.KpisFixtures

  alias Operately.Notifications.{Subscription, SubscriptionList}

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:champion, :space)

    Enum.reduce(1..3, ctx, fn num, ctx ->
      kpi_name = String.to_atom("kpi_#{num}")
      kpi = kpi_fixture(ctx.creator, %{space_id: ctx.space.id, champion_id: ctx.champion.id, name: "KPI #{num}"})

      ctx
      |> Map.put(kpi_name, kpi)
      |> reset_kpi_subscription_list(kpi_name)
    end)
  end

  test "creates subscriptions lists for existing KPIs and subscribes the champion", ctx do
    kpis = [ctx.kpi_1, ctx.kpi_2, ctx.kpi_3]

    Enum.each(kpis, fn kpi ->
      assert kpi.subscription_list_id == nil
    end)

    Operately.Data.Change113CreateSubscriptionListsForKpis.run()

    Enum.each(kpis, fn kpi ->
      kpi = Repo.reload(kpi)

      assert kpi.subscription_list_id != nil
      assert {:ok, subscription_list} = SubscriptionList.get(:system, id: kpi.subscription_list_id)
      assert subscription_list.parent_id == kpi.id
      assert subscription_list.parent_type == :kpi

      assert {:ok, subscription} =
               Subscription.get(:system, subscription_list_id: kpi.subscription_list_id, person_id: ctx.champion.id)

      assert subscription.type == :invited
    end)
  end

  test "does not create duplicate subscription lists for KPIs that already have them", ctx do
    kpi = kpi_fixture(ctx.creator, %{space_id: ctx.space.id, name: "Already subscribed"})
    {:ok, subscription_list} = SubscriptionList.get(:system, id: kpi.subscription_list_id)

    Operately.Data.Change113CreateSubscriptionListsForKpis.run()

    kpi = Repo.reload(kpi)
    assert kpi.subscription_list_id == subscription_list.id

    subscription_lists = Repo.all(from(sl in SubscriptionList, where: sl.parent_id == ^kpi.id))
    assert length(subscription_lists) == 1
  end

  defp reset_kpi_subscription_list(ctx, kpi_name) do
    kpi = ctx[kpi_name]
    subscription_list_id = kpi.subscription_list_id

    {1, nil} =
      Repo.update_all(
        from(k in Operately.Kpis.Kpi, where: k.id == ^kpi.id),
        set: [subscription_list_id: nil]
      )

    from(s in Subscription, where: s.subscription_list_id == ^subscription_list_id)
    |> Repo.delete_all()

    from(sl in SubscriptionList, where: sl.id == ^subscription_list_id)
    |> Repo.delete_all()

    Map.put(ctx, kpi_name, Repo.reload(kpi))
  end
end
