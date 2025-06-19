defmodule Operately.Support.ResourceHub.Deletion do
  alias Operately.Support.Features.ResourceHubSteps, as: Steps

  defmacro __using__(_opts) do
    quote do
      import Operately.Support.ResourceHub.Deletion
    end
  end

  def delete_resource_from_nodes_list(ctx, resource_name) do
    ctx
    |> Steps.visit_resource_hub_page()
    |> Steps.delete_resource(resource_name)
    |> Steps.confirm_deletion()
    |> Steps.assert_resource_deleted(resource_name)
  end

  def delete_resource_redirects_to_resource_hub(ctx, hub_name) do
    ctx
    |> Steps.delete_resource()
    |> Steps.confirm_deletion()
    |> Steps.assert_page_is_resource_hub_root(name: hub_name)
    |> Steps.assert_zero_state(hub_name)
  end

  def delete_resource_redirects_to_folder(ctx) do
    ctx
    |> Steps.delete_resource()
    |> Steps.confirm_deletion()
    |> Steps.assert_page_is_folder_root(folder_key: :folder)
    |> Steps.assert_zero_folder_state()
  end
end
