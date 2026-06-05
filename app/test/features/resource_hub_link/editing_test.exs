defmodule Operately.Features.ResourceHubLink.EditingTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ResourceHubLinkCase

  @link %{
    title: "Link",
    url: "http://localhost:4000",
    notes: "This is a link"
  }

  describe "Link actions" do
    feature "edit link", ctx do
      link = %{
        title: "Link (edited)",
        url: "http://localhost:3000",
        notes: "This is a link (also edited)",
        previous_title: @link.title,
        previous_url: @link.url
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
  end
end
