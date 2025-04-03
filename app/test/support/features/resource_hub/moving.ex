defmodule Operately.Support.ResourceHub.Moving do
  alias Operately.Support.Features.ResourceHubSteps, as: Steps

  defmacro __using__(_opts) do
    quote do
      import Operately.Support.ResourceHub.Moving
    end
  end

  def move_resource_to_child_folder(ctx, resource_name: resource_name) do
    ctx
    |> Steps.visit_resource_hub_page("Resource hub")
    |> Steps.move_resource_to_child_folder(resource_name)
    |> Steps.visit_folder_page(:five)
    |> Steps.assert_resource_present_in_files_list(resource_name)
    |> Steps.visit_resource_hub_page("Resource hub")
    |> Steps.refute_resource_present_in_files_list(resource_name)
  end

  def move_resource_to_parent_folder(ctx, resource_name: resource_name) do
    ctx
    |> Steps.visit_folder_page(:five)
    |> Steps.move_resource_to_parent_folder(resource_name)
    |> Steps.visit_folder_page(:one)
    |> Steps.assert_resource_present_in_files_list(resource_name)
    |> Steps.visit_folder_page(:five)
    |> Steps.refute_resource_present_in_files_list(resource_name)
  end

  def move_resource_to_hub_root(ctx, resource_name: resource_name) do
    ctx
    |> Steps.visit_folder_page(:five)
    |> Steps.move_resource_to_hub_root(resource_name)
    |> Steps.visit_resource_hub_page("Resource hub")
    |> Steps.assert_resource_present_in_files_list(resource_name)
    |> Steps.visit_folder_page(:five)
    |> Steps.refute_resource_present_in_files_list(resource_name)
  end
end
