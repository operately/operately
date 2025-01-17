defmodule Operately.Features.ResourceHubLinkTest do
  use Operately.FeatureCase
  use Operately.Support.ResourceHub.{Deletion, Comments}

  alias Operately.Support.Features.ResourceHubLinkSteps, as: Steps

  @link %{
    title: "Link",
    url: "http://localhost:4000",
    notes: "This is a link",
  }

  setup ctx, do: Steps.setup(ctx)

  describe "Create links" do
    feature "general link", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_link(@link)
      |> Steps.assert_link_content(@link)
      |> Steps.assert_link_created_on_space_feed(@link.title)
      |> Steps.assert_link_created_on_company_feed(@link.title)
      |> Steps.assert_link_created_notification_sent(@link.title)
      |> Steps.assert_link_created_email_sent()
    end

    feature "Airtable link", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_airtable_link(@link)
      |> Steps.assert_link_content(@link)
      |> Steps.assert_link_is_airtable(@link.title)
    end

    feature "Dropbox link", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_dropbox_link(@link)
      |> Steps.assert_link_content(@link)
      |> Steps.assert_link_is_dropbox(@link.title)
    end

    feature "Figma link", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_figma_link(@link)
      |> Steps.assert_link_content(@link)
      |> Steps.assert_link_is_figma(@link.title)
    end

    feature "Notion link", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_notion_link(@link)
      |> Steps.assert_link_content(@link)
      |> Steps.assert_link_is_notion(@link.title)
    end

    feature "Google Doc link", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_google_doc_link(@link)
      |> Steps.assert_link_content(@link)
      |> Steps.assert_link_is_google_doc(@link.title)
    end

    feature "Google Sheet link", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_google_sheet_link(@link)
      |> Steps.assert_link_content(@link)
      |> Steps.assert_link_is_google_sheet(@link.title)
    end

    feature "Google Slide link", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_google_slide_link(@link)
      |> Steps.assert_link_content(@link)
      |> Steps.assert_link_is_google_slide(@link.title)
    end

    feature "Google link", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_google_link(@link)
      |> Steps.assert_link_content(@link)
      |> Steps.assert_link_is_google(@link.title)
    end
  end

  describe "Link actions" do
    feature "edit link", ctx do
      link = %{
        title: "Link (edited)",
        url: "http://localhost:3000",
        notes: "This is a link (also edited)",

        previous_title: @link.title,
        previous_url: @link.url,
      }

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_link(@link)
      |> Steps.edit_link(link)
      |> Steps.assert_link_content(link)
      |> Steps.assert_link_edited_on_space_feed(link)
      |> Steps.assert_link_edited_on_company_feed(link)
      |> Steps.assert_link_edited_notification_sent(link.title)
      |> Steps.assert_link_edited_email_sent(link.title)
    end

    feature "editing a link without any changes doesn't make an API call", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_link(@link)
      |> Steps.edit_link(@link)
      |> Steps.assert_link_content(@link)
      |> Steps.refute_link_edited_on_space_feed(@link)
      |> Steps.refute_link_edited_on_company_feed(@link)
    end

    feature "link navigation works", ctx do
      ctx
      |> Steps.given_link_within_nested_folders_exists()
      |> Steps.visit_link_page()
      |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two", "three", "four", "five"])
      |> Steps.navigate_back("two")
      |> Steps.refute_navigation_links(["two", "three", "four", "five"])
      |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one"])
      |> Steps.navigate_back("Resource hub")
      |> Steps.refute_navigation_links(["Resource hub", "one"])
      |> Steps.assert_navigation_links(["Product Space"])
    end
  end

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
      |> delete_resource_redirects_to_resource_hub()
    end

    feature "deleting link within folder from link page redirects to folder", ctx do
      ctx
      |> Steps.given_link_within_folder_exists()
      |> Steps.visit_link_page()
      |> delete_resource_redirects_to_folder()
    end
  end
end
