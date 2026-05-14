defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Projects.CreateCheckIn do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.Notifications.SubscriptionList

  @impl true
  def mutation_name, do: "projects/create_check_in"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
  end

  @impl true
  def inputs(ctx) do
    %{
      project_id: Paths.project_id(ctx.project),
      status: "on_track",
      description: rich_text_string("Updated content")
    }
  end

  @impl true
  def assert(response, _ctx) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(response.check_in.id)
    {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

    assert response.check_in.id
    assert list.send_to_everyone
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
