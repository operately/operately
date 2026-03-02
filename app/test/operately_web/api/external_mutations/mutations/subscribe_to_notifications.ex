defmodule OperatelyWeb.Api.ExternalMutations.Mutations.SubscribeToNotifications do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "subscribe_to_notifications"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)

  end

  @impl true
  def inputs(ctx) do
    list = Repo.preload(ctx.project, :subscription_list).subscription_list

    %{
      id: Paths.subscription_list_id(list),
      type: "project"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert is_map(response)
    refute Map.has_key?(response, :error)
  end
end
