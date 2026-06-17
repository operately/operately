defmodule OperatelyWeb.Api.CliBackwardCompatibility.ResourceHubsTest do
  @moduledoc """
  Backward compatibility tests for legacy `resource_hubs/*` external API routes.

  CLI releases after 1.7.0 moved Resource Hub commands to `documents/*` and
  removed `resource_hubs/*` from the generated catalog.

  Users on CLI <= 1.6.0 still call the old paths, e.g.
  `GET /api/external/v1/resource_hubs/get` and
  `POST /api/external/v1/resource_hubs/create_folder`. The backend no longer
  adds the commands to the catalog but keeps those routes reachable.
  """

  test "legacy resource_hubs/create_folder creates a folder", ctx do
    Steps.create_folder(ctx)
  end

  test "legacy resource_hubs/get_folder returns a folder", ctx do
    ctx
    |> Steps.setup_folder()
    |> Steps.get_folder()
  end

  test "legacy resource_hubs/list_nodes lists hub nodes", ctx do
    Steps.list_nodes(ctx)
  end

  test "legacy resource_hubs/rename_folder renames a folder", ctx do
    ctx
    |> Steps.setup_folder()
    |> Steps.rename_folder()
  end

  test "legacy resource_hubs/copy_folder copies a folder", ctx do
    ctx
    |> Steps.setup_folder()
    |> Steps.copy_folder()
  end

  test "legacy resource_hubs/update_parent_folder moves a resource into a folder", ctx do
    ctx
    |> Steps.setup_folder()
    |> Steps.update_parent_folder()
  end

  test "legacy resource_hubs/delete_folder deletes a folder", ctx do
    ctx
    |> Steps.setup_folder()
    |> Steps.delete_folder()
  end
end
