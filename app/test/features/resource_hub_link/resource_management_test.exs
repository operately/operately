defmodule Operately.Features.ResourceHubLink.ResourceManagementTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ResourceHubLinkCase

  @link %{
    title: "Link",
    url: "http://localhost:4000",
    notes: "This is a link"
  }

  describe "Delete" do
    feature "deleting link adds event to feed", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_link(@link)
      |> Steps.visit_resource_hub_page()
      |> delete_resource_from_nodes_list(@link.title)
      |> Steps.assert_link_deleted_on_space_feed()
      |> Steps.assert_link_deleted_on_company_feed()
    end

    feature "deleting link sends notifications", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_link(@link)
      |> Steps.visit_resource_hub_page()
      |> delete_resource_from_nodes_list(@link.title)
      |> Steps.assert_link_deleted_notification_sent()
      |> Steps.assert_link_deleted_email_sent()
    end

    feature "delete link from content list", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_link(@link)
      |> Steps.visit_resource_hub_page()
      |> delete_resource_from_nodes_list(@link.title)
    end

    feature "deleting link from link page redirects to resource hub", ctx do
      ctx
      |> Steps.given_link_exists()
      |> Steps.visit_link_page()
      |> delete_resource_redirects_to_resource_hub("Resource hub")
    end

    feature "deleting link within folder from link page redirects to folder", ctx do
      ctx
      |> Steps.given_link_within_folder_exists()
      |> Steps.visit_link_page()
      |> delete_resource_redirects_to_folder()
    end
  end

  describe "Move" do
    @resource_name "Link"

    feature "Moving link to child folder", ctx do
      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.given_link_exists(:hub)
      |> move_resource_to_child_folder(resource_name: @resource_name)
    end

    feature "Moving link to parent folder", ctx do
      ctx
      |> Steps.given_link_within_nested_folders_exists()
      |> move_resource_to_parent_folder(resource_name: @resource_name)
    end

    feature "Moving link to resource hub root", ctx do
      ctx
      |> Steps.given_link_within_nested_folders_exists()
      |> move_resource_to_hub_root(resource_name: @resource_name)
    end
  end
end
