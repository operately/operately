defmodule OperatelyWeb.Api.ExternalMutations.Mutations.UnsubscribeFromNotifications do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "unsubscribe_from_notifications"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_discussion(:project_discussion, :project)
  end

  @impl true
  def inputs(ctx) do
    list = Repo.preload(ctx.project_discussion, :subscription_list).subscription_list

    %{
      id: Paths.subscription_list_id(list)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert is_map(response)
    refute Map.has_key?(response, :error)
  end
end
