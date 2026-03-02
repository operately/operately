defmodule OperatelyWeb.Api.ExternalMutations.Mutations.MarkAllNotificationsAsRead do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "mark_all_notifications_as_read"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
  end

  @impl true
  def inputs(_) do
    %{}
  end

  @impl true
  def assert(response, _ctx) do
    assert is_map(response)
    refute Map.has_key?(response, :error)
  end
end
