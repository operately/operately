defmodule Operately.Features.ResourceHubLink.ProviderLinksTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ResourceHubLinkCase

  @link %{
    title: "Link",
    url: "http://localhost:4000",
    notes: "This is a link"
  }

  describe "Create links" do
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
end
