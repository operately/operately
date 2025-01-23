defmodule Operately.Support.ResourceHub.Moving do
  alias Operately.Support.Features.ResourceHubSteps, as: Steps

  defmacro __using__(_opts) do
    quote do
      import Operately.Support.ResourceHub.Moving
    end
  end

  def move_resource_to_child_folder(ctx, attrs) do
    hub_name = Keyword.get(attrs, :hub_name, "Resource hub")
    resource_name = Keyword.get(attrs, :resource_name)

    ctx
    |> Steps.visit_resource_hub_page(hub_name)
    |> Steps.move_resource_to_child_folder(resource_name)
    |> Steps.visit_folder_page(:five)
    |> Steps.assert_resource_present_in_files_list(resource_name)
    |> Steps.visit_resource_hub_page(hub_name)
    |> Steps.refute_resource_present_in_files_list(resource_name)
  end
end
