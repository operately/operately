defmodule Operately.Data.Change095DeleteDuplicateSubscriptionsTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Data.Change095DeleteDuplicateSubscriptions
  alias Operately.Notifications.Subscription
  alias Operately.Support.Factory

  setup ctx do
    ctx = Factory.setup(ctx)
    ctx = Factory.add_company_member(ctx, :person_1)
    ctx = Factory.add_company_member(ctx, :person_2)

    {:ok, list_1} = Operately.Notifications.create_subscription_list()
    {:ok, list_2} = Operately.Notifications.create_subscription_list()

    Map.merge(ctx, %{list_1: list_1, list_2: list_2})
  end

  test "keeps the highest weighted subscription for a duplicated person/list pair", ctx do
    drop_unique_constraint()

    insert_subscription(%{
      subscription_list_id: ctx.list_1.id,
      person_id: ctx.creator.id,
      type: "joined",
      canceled: true,
      inserted_at: ~N[2026-03-30 10:00:00],
      updated_at: ~N[2026-03-30 10:00:00]
    })

    kept_id =
      insert_subscription(%{
        subscription_list_id: ctx.list_1.id,
        person_id: ctx.creator.id,
        type: "invited",
        canceled: false,
        inserted_at: ~N[2026-03-31 10:00:00],
        updated_at: ~N[2026-03-31 10:00:00]
      })

    insert_subscription(%{
      subscription_list_id: ctx.list_1.id,
      person_id: ctx.creator.id,
      type: "mentioned",
      canceled: false,
      inserted_at: ~N[2026-03-29 10:00:00],
      updated_at: ~N[2026-03-29 10:00:00]
    })
    assert subscription_count(ctx.list_1.id, ctx.creator.id) == 3

    Change095DeleteDuplicateSubscriptions.run()

    create_unique_constraint()

    assert subscription_count(ctx.list_1.id, ctx.creator.id) == 1

    kept_subscription =
      Repo.one!(
        from(s in Subscription,
          where: s.subscription_list_id == ^ctx.list_1.id and s.person_id == ^ctx.creator.id
        )
      )

    assert kept_subscription.id == kept_id
    assert kept_subscription.type == :invited
    assert kept_subscription.canceled == false
  end

  test "keeps the highest type weight when all duplicates are canceled", ctx do
    drop_unique_constraint()

    insert_subscription(%{
      subscription_list_id: ctx.list_1.id,
      person_id: ctx.person_1.id,
      type: "mentioned",
      canceled: true
    })

    insert_subscription(%{
      subscription_list_id: ctx.list_1.id,
      person_id: ctx.person_1.id,
      type: "invited",
      canceled: true
    })

    kept_id =
      insert_subscription(%{
        subscription_list_id: ctx.list_1.id,
        person_id: ctx.person_1.id,
        type: "joined",
        canceled: true
      })

    assert subscription_count(ctx.list_1.id, ctx.person_1.id) == 3

    Change095DeleteDuplicateSubscriptions.run()

    create_unique_constraint()

    assert subscription_count(ctx.list_1.id, ctx.person_1.id) == 1

    kept_subscription =
      Repo.one!(
        from(s in Subscription,
          where: s.subscription_list_id == ^ctx.list_1.id and s.person_id == ^ctx.person_1.id
        )
      )

    assert kept_subscription.id == kept_id
    assert kept_subscription.type == :joined
    assert kept_subscription.canceled == true
  end

  test "uses recency as a tiebreaker when weights are identical", ctx do
    drop_unique_constraint()

    older_id =
      insert_subscription(%{
        subscription_list_id: ctx.list_2.id,
        person_id: ctx.person_2.id,
        type: "invited",
        canceled: false,
        inserted_at: ~N[2026-03-30 10:00:00],
        updated_at: ~N[2026-03-30 10:00:00]
      })

    newer_id =
      insert_subscription(%{
        subscription_list_id: ctx.list_2.id,
        person_id: ctx.person_2.id,
        type: "invited",
        canceled: false,
        inserted_at: ~N[2026-03-31 10:00:00],
        updated_at: ~N[2026-03-31 10:00:00]
      })

    assert subscription_count(ctx.list_2.id, ctx.person_2.id) == 2

    Change095DeleteDuplicateSubscriptions.run()

    create_unique_constraint()

    refute Repo.get(Subscription, older_id)
    assert Repo.get(Subscription, newer_id)
    assert subscription_count(ctx.list_2.id, ctx.person_2.id) == 1
  end

  defp drop_unique_constraint do
    Repo.query!("DROP INDEX IF EXISTS subscriptions_subscription_list_id_person_id_index")
  end

  defp create_unique_constraint do
    Repo.query!(
      "CREATE UNIQUE INDEX subscriptions_subscription_list_id_person_id_index ON subscriptions (subscription_list_id, person_id)"
    )
  end

  defp insert_subscription(attrs) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
    id = Ecto.UUID.generate()

    data =
      attrs
      |> Enum.into(%{
        id: id,
        type: "invited",
        canceled: false,
        inserted_at: now,
        updated_at: now
      })
      |> Map.update!(:id, &Ecto.UUID.dump!/1)
      |> Map.update!(:subscription_list_id, &Ecto.UUID.dump!/1)
      |> Map.update!(:person_id, &Ecto.UUID.dump!/1)

    Repo.insert_all("subscriptions", [data])

    id
  end

  defp subscription_count(subscription_list_id, person_id) do
    Repo.one(
      from(s in Subscription,
        where: s.subscription_list_id == ^subscription_list_id,
        where: s.person_id == ^person_id,
        select: count(s.id)
      )
    )
  end
end
