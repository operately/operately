defmodule Operately.Features.ResourceHubLink.CommentsAndNavigationTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ResourceHubLinkCase

  @link %{
    title: "Link",
    url: "http://localhost:4000",
    notes: "This is a link"
  }

  describe "Link actions" do
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

    feature "add comment to link", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_link(@link)
      |> comment_on_resource()
      |> Steps.assert_link_commented_on_space_feed(@link.title)
      |> Steps.assert_link_commented_on_company_feed(@link.title)
      |> Steps.assert_link_commented_notification_sent(@link.title)
      |> Steps.assert_link_commented_email_sent(@link.title)
    end

    feature "delete comment from link", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_link(@link)
      |> Steps.visit_link_page()
      |> leave_one_comment()
      |> delete_comment_on_resource()
      |> Steps.assert_link_commented_on_space_feed(@link.title)
      |> Steps.assert_link_commented_on_company_feed(@link.title)
    end
  end
end
