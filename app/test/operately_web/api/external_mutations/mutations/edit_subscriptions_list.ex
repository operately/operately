defmodule OperatelyWeb.Api.ExternalMutations.Mutations.EditSubscriptionsList do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "edit_subscriptions_list"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:member, :space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_check_in(:check_in, :project, :creator)
  end

  @impl true
  def inputs(ctx) do
    list = Repo.preload(ctx.check_in, :subscription_list).subscription_list

    %{
      id: Paths.subscription_list_id(list),
      type: "project_check_in",
      send_notifications_to_everyone: false,
      subscriber_ids: [Paths.person_id(ctx.member)]
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert is_map(response)
    refute Map.has_key?(response, :error)
  end
end
