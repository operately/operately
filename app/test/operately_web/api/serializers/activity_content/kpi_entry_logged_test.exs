defmodule OperatelyWeb.Api.Serializers.ActivityContent.KpiEntryLoggedTest do
  use Operately.DataCase

  import Operately.KpisFixtures
  import Ecto.Query

  alias Operately.Support.Factory
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Paths
  alias Operately.Activities.{Activity, Preloader}

  setup ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space)
    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    entry = kpi_entry_fixture(ctx.creator, kpi)

    activity =
      Repo.one!(
        from(a in Activity,
          where: a.action == "kpi_entry_logged" and a.content["entry_id"] == ^entry.id
        )
      )

    activity = Operately.Activities.cast_content(activity)
    Map.merge(ctx, %{kpi: kpi, entry: entry, activity: activity})
  end

  test "serializes preloaded references, numeric value, and calendar period", ctx do
    content =
      ctx.activity |> Preloader.preload() |> Map.fetch!(:content) |> Serializer.serialize()

    assert content.__typename == "activity_content_kpi_entry_logged"
    assert content.space.id == Paths.space_id(ctx.space)
    assert content.kpi.id == Paths.kpi_id(ctx.kpi)
    assert content.entry.id == Paths.kpi_entry_id(ctx.entry)
    assert content.entry.__typename == "kpi_entry"
    assert content.entry.value == 42.0
    assert content.entry.period == "2026-01-01"
    assert content.value == 42.0
    assert is_number(content.value)
    assert content.period == "2026-01-01"
  end

  test "unavailable KPI and entry references serialize as null", ctx do
    activity = ctx.activity
    activity = put_in(activity.content.kpi_id, Ecto.UUID.generate())
    activity = put_in(activity.content.entry_id, Ecto.UUID.generate())
    content = activity |> Preloader.preload() |> Map.fetch!(:content) |> Serializer.serialize()

    assert content.space.id == Paths.space_id(ctx.space)
    assert content.kpi == nil
    assert content.entry == nil
    assert content.value == 42.0
    assert content.period == "2026-01-01"
  end

  test "explicitly null KPI and entry references serialize as null", ctx do
    content = ctx.activity |> Preloader.preload() |> Map.fetch!(:content)
    result = Serializer.serialize(%{content | kpi: nil, entry: nil})
    assert result.kpi == nil
    assert result.entry == nil
    assert result.__typename == "activity_content_kpi_entry_logged"
  end
end
