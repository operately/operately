defmodule OperatelyWeb.Api.ExternalQueries.Queries.Notifications.List do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths
  import Operately.KpisFixtures

  def query_name, do: "notifications/list"

  @impl true
  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:author, :space)

    kpi = kpi_fixture(ctx.author, space_id: ctx.space.id, champion_id: ctx.creator.id)
    entry = kpi_entry_fixture(ctx.author, kpi)
    Map.merge(ctx, %{kpi: kpi, entry: entry})
  end

  @impl true
  def inputs(_ctx), do: %{page: 1, per_page: 100}

  @impl true
  def assert(response, ctx) do
    notification = Enum.find(response.notifications, &(&1.activity.action == "kpi_entry_logged"))
    assert notification
    refute notification.read
    assert notification.read_at == nil
    assert notification.activity.author.id == Paths.person_id(ctx.author)
    content = notification.activity.content
    assert content.__typename == "activity_content_kpi_entry_logged"
    assert content.space.id == Paths.space_id(ctx.space)
    assert content.kpi.id == Paths.kpi_id(ctx.kpi)
    assert content.entry.id == Paths.kpi_entry_id(ctx.entry)
    assert content.value == 42.0
    assert content.period == "2026-01-01"
  end
end
