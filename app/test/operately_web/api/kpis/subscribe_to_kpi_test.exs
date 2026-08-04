defmodule OperatelyWeb.Api.Kpis.SubscribeToKpiTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 2]
  import Operately.KpisFixtures

  alias Operately.Notifications.Subscription

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:kpis, :subscribe_to_kpi], %{})
      assert {401, _} = mutation(ctx.conn, [:kpis, :unsubscribe_from_kpi], %{})
    end
  end

  describe "subscribe_to_kpi / unsubscribe_from_kpi" do
    setup ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_space_member(:member, :space)
        |> Factory.add_space_member(:champion, :space)
        |> Factory.add_company_member(:outsider)

      kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id)
      Map.put(ctx, :kpi, kpi)
    end

    test "a space member can subscribe and then unsubscribe from a KPI", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      assert {200, %{success: true}} = mutation(ctx.conn, [:kpis, :subscribe_to_kpi], %{kpi_id: Paths.kpi_id(ctx.kpi)})
      assert subscribed?(ctx.kpi, ctx.member)

      assert {200, %{success: true}} = mutation(ctx.conn, [:kpis, :unsubscribe_from_kpi], %{kpi_id: Paths.kpi_id(ctx.kpi)})
      refute subscribed?(ctx.kpi, ctx.member)
    end

    test "a non-space-member cannot subscribe", ctx do
      ctx = Factory.log_in_person(ctx, :outsider)

      assert {404, _} = mutation(ctx.conn, [:kpis, :subscribe_to_kpi], %{kpi_id: Paths.kpi_id(ctx.kpi)})
      refute subscribed?(ctx.kpi, ctx.outsider)
    end
  end

  defp subscribed?(kpi, person) do
    from(s in Subscription,
      where: s.subscription_list_id == ^kpi.subscription_list_id and s.person_id == ^person.id and not s.canceled
    )
    |> Operately.Repo.exists?()
  end
end
