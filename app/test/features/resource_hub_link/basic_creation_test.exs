defmodule Operately.Features.ResourceHubLink.BasicCreationTest do
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
    feature "create link with empty description", ctx do
      data = %{title: "Link", url: "http://localhost:4000"}

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_link(data)
      |> Steps.assert_link_content(data)
    end

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
  end
end
