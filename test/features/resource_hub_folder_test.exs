defmodule Operately.Features.ResourceHubFolderTest do
  use Operately.FeatureCase
  use Operately.Support.ResourceHub.Deletion

  alias Operately.Support.Features.ResourceHubFolderSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "folders" do
    feature "resource hub zero state", ctx do
      ctx
      |> Steps.visit_space_page()
      |> Steps.assert_zero_state_on_space_page()
      |> Steps.navigate_to_resource_hub_page()
      |> Steps.assert_zero_state()
    end

    feature "create folders at the root of resource hub", ctx do
      folder1 = "First Folder"
      folder2 = "Second Folder"

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_folder(folder1)
      |> Steps.assert_folder_created(%{name: folder1, index: 0})
      |> Steps.create_folder(folder2)
      |> Steps.assert_folder_created(%{name: folder2, index: 1})
    end

    feature "create nested folders", ctx do
      folder1 = "First Folder"
      folder2 = "Second Folder"
      folder3 = "Third Folder"
      folder4 = "Forth Folder"

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_folder(folder1)
      |> Steps.assert_folder_created(%{name: folder1, index: 0})
      |> Steps.navigate_to_folder(index: 0)
      |> Steps.create_folder(folder2)
      |> Steps.assert_folder_created(%{name: folder2, index: 0})
      |> Steps.navigate_to_folder(index: 0)
      |> Steps.create_folder(folder4)
      |> Steps.assert_folder_created(%{name: folder4, index: 0})
      |> Steps.create_folder(folder3)
      |> Steps.assert_folder_created(%{name: folder3, index: 1})
      |> Steps.navigate_back(folder1)
      |> Steps.assert_items_count(%{index: 0, items_count: "2 items"})
      |> Steps.navigate_back("Documents & Files")
      |> Steps.assert_items_count(%{index: 0, items_count: "1 item"})
    end

    feature "folder created feed event", ctx do
      folder = "Documents"

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_folder(folder)
      |> Steps.assert_folder_created(%{name: folder, index: 0})
      |> Steps.assert_folder_created_on_space_feed(folder)
      |> Steps.assert_folder_created_on_company_feed(folder)
    end

    feature "folder navigation works", ctx do
      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.visit_folder_page(:five)
      |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two", "three", "four"])
      |> Steps.navigate_back("three")
      |> Steps.refute_navigation_links(["three", "four"])
      |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two"])
      |> Steps.navigate_back("one")
      |> Steps.refute_navigation_links(["one", "two"])
      |> Steps.assert_navigation_links(["Product Space", "Resource hub"])
    end
  end

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
end
