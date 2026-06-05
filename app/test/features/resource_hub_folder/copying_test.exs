defmodule Operately.Features.ResourceHubFolder.CopyingTest do
  use Operately.FeatureCase
  use Operately.Support.ResourceHub.Deletion
  use Operately.Support.ResourceHub.Moving

  alias Operately.Support.Features.ResourceHubFolderSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "Copy" do
    feature "copy folder in the same location", ctx do
      copied_folder = %{
        name: "Folder's Copy",
        index: 1
      }

      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.given_folder_with_content_exists(:two)
      |> Steps.visit_folder_page(:two)
      |> Steps.refute_folder_in_files_list(copied_folder.name)
      |> Steps.copy_folder(copied_folder.name)
      |> Steps.visit_folder_page(:two)
      |> Steps.assert_folder_and_its_content_was_copied(copied_folder)
    end

    feature "copy folder into another folder", ctx do
      copied_folder = %{
        name: "Folder's Copy",
        index: 0
      }

      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.given_folder_with_content_exists(:two)
      |> Steps.visit_folder_page(:five)
      |> Steps.assert_zero_folder_state()
      |> Steps.visit_folder_page(:two)
      |> Steps.copy_folder_into_another_folder(copied_folder.name)
      |> Steps.visit_folder_page(:five)
      |> Steps.assert_folder_and_its_content_was_copied(copied_folder)
    end

    feature "copy folder into resource hub root", ctx do
      copied_folder = %{
        name: "Folder's Copy",
        index: 0
      }

      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.given_folder_with_content_exists(:four)
      |> Steps.visit_resource_hub_page("Resource hub")
      |> Steps.refute_folder_in_files_list(copied_folder.name)
      |> Steps.visit_folder_page(:four)
      |> Steps.copy_folder_into_resource_hub_root(copied_folder.name)
      |> Steps.visit_resource_hub_page("Resource hub")
      |> Steps.assert_folder_and_its_content_was_copied(copied_folder)
    end

    feature "copying folder creates feed event", ctx do
      copied_folder = %{
        original_name: "folder",
        name: "Folder's Copy",
        index: 0
      }

      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.given_folder_with_content_exists(:two)
      |> Steps.visit_folder_page(:two)
      |> Steps.copy_folder_into_another_folder(copied_folder.name)
      |> Steps.assert_folder_copied_on_space_feed(copied_folder)
      |> Steps.assert_folder_copied_on_company_feed(copied_folder)
    end
  end
end
