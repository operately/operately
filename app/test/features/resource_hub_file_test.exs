defmodule Operately.Features.ResourceHubFileTest do
  use Operately.FeatureCase
  use Operately.Support.ResourceHub.{Deletion, Comments, Moving}

  alias Operately.Support.Features.ResourceHubFileSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "File actions" do
    @original_file_attrs %{
      title: "Some File",
      description: "Content",
    }
    @new_file_attrs %{
      original_title: "Some File",
      title: "Edited title",
      description: "This is an edited description",
    }

    feature "edit file", ctx do
      ctx
      |> Steps.given_file_exists()
      |> Steps.visit_file_page()
      |> Steps.assert_file_content(@original_file_attrs)
      |> Steps.edit_file(@new_file_attrs)
      |> Steps.assert_file_content(@new_file_attrs)
    end

    feature "edit file from files list", ctx do
      ctx
      |> Steps.given_file_exists()
      |> Steps.visit_resource_hub_page()
      |> Steps.edit_file_from_files_list(@new_file_attrs)
      |> Steps.assert_file_content(@new_file_attrs)
    end

    feature "add comment to file", ctx do
      ctx
      |> Steps.given_file_exists()
      |> Steps.visit_file_page()
      |> comment_on_resource()
      |> Steps.assert_file_commented_on_company_feed()
      |> Steps.assert_file_commented_on_space_feed()
      |> Steps.assert_file_commented_notification_sent()
      |> Steps.assert_file_commented_email_sent()
    end

    feature "file navigation works", ctx do
      ctx
      |> Steps.given_file_within_nested_folders_exists()
      |> Steps.visit_file_page()
      |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two", "three", "four", "five"])
      |> Steps.navigate_back("four")
      |> Steps.refute_navigation_links(["four", "five"])
      |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two", "three"])
      |> Steps.navigate_back("Resource hub")
      |> Steps.refute_navigation_links(["Resource hub", "one", "two", "three"])
      |> Steps.assert_navigation_links(["Product Space"])
    end
  end

  describe "Delete" do
    feature "deleting file adds event to feed", ctx do
      ctx
      |> Steps.given_file_exists()
      |> delete_resource_from_nodes_list("Some File")
      |> Steps.assert_file_deleted_on_space_feed()
      |> Steps.assert_file_deleted_on_company_feed()
    end

    feature "deleting file sends notifications", ctx do
      ctx
      |> Steps.given_file_exists()
      |> delete_resource_from_nodes_list("Some File")
      |> Steps.assert_file_deleted_notification_sent()
      |> Steps.assert_file_deleted_email_sent()
    end

    feature "delete file from content list", ctx do
      ctx
      |> Steps.given_file_exists()
      |> delete_resource_from_nodes_list("Some File")
    end

    feature "deleting file from file page redirects to resource hub", ctx do
      ctx
      |> Steps.given_file_exists()
      |> Steps.visit_file_page()
      |> delete_resource_redirects_to_resource_hub("Documents & Files")
    end

    feature "deleting document within folder from document page redirects to folder", ctx do
      ctx
      |> Steps.given_file_within_folder_exists()
      |> Steps.visit_file_page()
      |> delete_resource_redirects_to_folder()
    end
  end

  describe "Move" do
    @resource_name "Some File"

    feature "Moving file to child folder", ctx do
      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.given_file_exists(:hub)
      |> move_resource_to_child_folder(resource_name: @resource_name)
    end

    feature "Moving file to parent folder", ctx do
      ctx
      |> Steps.given_file_within_nested_folders_exists()
      |> move_resource_to_parent_folder(resource_name: @resource_name)
    end

    feature "Moving file to resource hub root", ctx do
      ctx
      |> Steps.given_file_within_nested_folders_exists()
      |> move_resource_to_hub_root(resource_name: @resource_name)
    end
  end
end
