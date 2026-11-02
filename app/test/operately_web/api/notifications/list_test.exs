defmodule OperatelyWeb.Api.Notifications.ListTest do
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures
  import Ecto.Query

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:recipient, :space)

    Repo.delete_all(Operately.Notifications.Notification)
    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.recipient.id)
    entry = kpi_entry_fixture(ctx.creator, kpi)

    activity =
      Repo.one!(
        from(a in Operately.Activities.Activity,
          where: a.action == "kpi_entry_logged" and a.content["entry_id"] == ^entry.id
        )
      )

    notification =
      Repo.one!(
        from(n in Operately.Notifications.Notification,
          where: n.person_id == ^ctx.recipient.id and n.activity_id == ^activity.id
        )
      )

    Map.merge(ctx, %{kpi: kpi, entry: entry, activity: activity, notification: notification})
  end

  test "requires authentication", ctx do
    assert {401, _} = query(ctx.conn, [:notifications, :list], %{page: 1, per_page: 100})
  end

  test "returns a persisted logged KPI notification with its content and read state", ctx do
    {:ok, notification} = Operately.Notifications.mark_as_read(ctx.notification)
    ctx = Factory.log_in_person(ctx, :recipient)

    assert {200, %{notifications: results}} =
             query(ctx.conn, [:notifications, :list], %{page: 1, per_page: 100})

    result = Enum.find(results, &(&1.id == notification.id))
    assert result.id == notification.id
    assert result.read
    assert result.read_at == Serializer.serialize(notification.read_at)
    assert result.activity.id == Paths.activity_id(ctx.activity)
    assert result.activity.action == "kpi_entry_logged"
    assert result.activity.author.id == Paths.person_id(ctx.creator)

    content = result.activity.content
    assert content.__typename == "activity_content_kpi_entry_logged"
    assert content.space.id == Paths.space_id(ctx.space)
    assert content.kpi.id == Paths.kpi_id(ctx.kpi)
    assert content.entry.id == Paths.kpi_entry_id(ctx.entry)
    assert content.value == 42.0
    assert is_number(content.value)
    assert content.period == "2026-01-01"
  end

  test "keeps supported notifications, newest-first ordering, and pagination", ctx do
    created =
      Repo.one!(
        from(a in Operately.Activities.Activity,
          where: a.action == "kpi_created" and a.content["kpi_id"] == ^ctx.kpi.id
        )
      )

    older =
      Repo.one!(
        from(n in Operately.Notifications.Notification,
          where: n.person_id == ^ctx.recipient.id and n.activity_id == ^created.id
        )
      )

    Repo.update_all(from(n in Operately.Notifications.Notification, where: n.id == ^older.id),
      set: [inserted_at: ~N[2026-01-01 00:00:00]]
    )

    ctx = Factory.log_in_person(ctx, :recipient)

    assert {200, %{notifications: [logged, supported]}} =
             query(ctx.conn, [:notifications, :list], %{page: 1, per_page: 100})

    assert logged.id == ctx.notification.id
    refute logged.read
    assert logged.read_at == nil
    assert supported.id == older.id
    assert supported.activity.action == "kpi_created"

    assert {200, %{notifications: [first]}} =
             query(ctx.conn, [:notifications, :list], %{page: 1, per_page: 1})

    assert first.id == logged.id

    assert {200, %{notifications: [second]}} =
             query(ctx.conn, [:notifications, :list], %{page: 2, per_page: 1})

    assert second.id == supported.id

    assert {200, %{notifications: []}} =
             query(ctx.conn, [:notifications, :list], %{page: 3, per_page: 1})
  end

  test "does not expose another recipient's notifications", ctx do
    ctx = Factory.log_in_person(ctx, :creator)

    assert {200, %{notifications: []}} =
             query(ctx.conn, [:notifications, :list], %{page: 1, per_page: 100})
  end
end
