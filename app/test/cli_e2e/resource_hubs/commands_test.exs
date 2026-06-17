defmodule Operately.CliE2E.ResourceHubs.CommandsTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.ResourceHubs.CommandsSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "resource_hubs get returns the hub", ctx do
    Steps.get_resource_hub(ctx)
  end

  test "resource_hubs create_folder creates a folder", ctx do
    Steps.create_folder(ctx)
  end

  test "resource_hubs get_folder returns a folder", ctx do
    ctx
    |> Steps.setup_folder()
    |> Steps.get_folder()
  end

  test "resource_hubs list_nodes lists hub nodes", ctx do
    Steps.list_nodes(ctx)
  end

  test "resource_hubs rename_folder renames a folder", ctx do
    ctx
    |> Steps.setup_folder()
    |> Steps.rename_folder()
  end

  test "resource_hubs copy_folder copies a folder", ctx do
    ctx
    |> Steps.setup_folder()
    |> Steps.copy_folder()
  end

  test "resource_hubs update_parent_folder moves a resource into a folder", ctx do
    ctx
    |> Steps.setup_folder()
    |> Steps.update_parent_folder()
  end

  test "resource_hubs delete_folder deletes a folder", ctx do
    ctx
    |> Steps.setup_folder()
    |> Steps.delete_folder()
  end
end
