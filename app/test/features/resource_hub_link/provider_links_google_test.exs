defmodule Operately.Features.ResourceHubLink.ProviderLinksGoogleTest do
  use Operately.FeatureCase
  use Operately.Support.ResourceHub.Deletion
  use Operately.Support.ResourceHub.Comments
  use Operately.Support.ResourceHub.Moving

  alias Operately.Support.Features.ResourceHubLinkSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @link %{
    title: "Link",
    url: "http://localhost:4000",
    notes: "This is a link"
  }

  describe "Create links" do
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
