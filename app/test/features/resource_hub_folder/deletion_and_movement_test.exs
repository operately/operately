defmodule Operately.Features.ResourceHubFolder.DeletionAndMovementTest do
  use Operately.FeatureCase
  use Operately.Support.ResourceHub.Deletion
  use Operately.Support.ResourceHub.Moving

  alias Operately.Support.Features.ResourceHubFolderSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "Delete" do
    feature "deleting folder adds event to feed", ctx do
      name = "Folder"

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_folder(name)
      |> Steps.assert_folder_created(%{name: name, index: 0})
      |> delete_resource_from_nodes_list(name)
      |> Steps.assert_folder_deleted_on_space_feed(name)
      |> Steps.assert_folder_deleted_on_company_feed(name)
    end

    feature "delete folder from content list", ctx do
      name = "Folder"

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_folder(name)
      |> Steps.assert_folder_created(%{name: name, index: 0})
      |> delete_resource_from_nodes_list(name)
    end
  end

  describe "Move" do
    @resource_name "unique_folder"

    feature "Moving folder to child folder", ctx do
      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.given_folder_exists(:hub)
      |> move_resource_to_child_folder(resource_name: @resource_name)
    end

    feature "Moving folder to parent folder", ctx do
      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.visit_folder_page(:five)
      |> Steps.create_folder(@resource_name)
      |> move_resource_to_parent_folder(resource_name: @resource_name)
    end

    feature "Moving folder to resource hub root", ctx do
      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.visit_folder_page(:five)
      |> Steps.create_folder(@resource_name)
      |> move_resource_to_hub_root(resource_name: @resource_name)
    end
  end
end
