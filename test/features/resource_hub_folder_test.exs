defmodule Operately.Features.ResourceHubFolderTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ResourceHubSteps, as: Steps
  alias Operately.Support.Features.ResourceHubFolderSteps, as: FolderSteps

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
      |> FolderSteps.create_folder(folder1)
      |> FolderSteps.assert_folder_created(%{name: folder1, index: 0})
      |> FolderSteps.create_folder(folder2)
      |> FolderSteps.assert_folder_created(%{name: folder2, index: 1})
    end

    feature "create nested folders", ctx do
      folder1 = "First Folder"
      folder2 = "Second Folder"
      folder3 = "Third Folder"
      folder4 = "Forth Folder"

      ctx
      |> Steps.visit_resource_hub_page()
      |> FolderSteps.create_folder(folder1)
      |> FolderSteps.assert_folder_created(%{name: folder1, index: 0})
      |> FolderSteps.navigate_to_folder(index: 0)
      |> FolderSteps.create_folder(folder2)
      |> FolderSteps.assert_folder_created(%{name: folder2, index: 0})
      |> FolderSteps.navigate_to_folder(index: 0)
      |> FolderSteps.create_folder(folder4)
      |> FolderSteps.assert_folder_created(%{name: folder4, index: 0})
      |> FolderSteps.create_folder(folder3)
      |> FolderSteps.assert_folder_created(%{name: folder3, index: 1})
      |> Steps.navigate_back(folder1)
      |> FolderSteps.assert_items_count(%{index: 0, items_count: "2 items"})
      |> Steps.navigate_back("Documents & Files")
      |> FolderSteps.assert_items_count(%{index: 0, items_count: "1 item"})
    end

    feature "folder created feed event", ctx do
      folder = "Documents"

      ctx
      |> Steps.visit_resource_hub_page()
      |> FolderSteps.create_folder(folder)
      |> FolderSteps.assert_folder_created(%{name: folder, index: 0})
      |> FolderSteps.assert_folder_created_on_space_feed(folder)
      |> FolderSteps.assert_folder_created_on_company_feed(folder)
    end

    feature "folder navigation works", ctx do
      ctx
      |> FolderSteps.given_nested_folders_exist()
      |> FolderSteps.visit_folder_page(:five)
      |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two", "three", "four"])
      |> Steps.navigate_back("three")
      |> Steps.refute_navigation_links(["three", "four"])
      |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two"])
      |> Steps.navigate_back("one")
      |> Steps.refute_navigation_links(["one", "two"])
      |> Steps.assert_navigation_links(["Product Space", "Resource hub"])
    end
  end
end
