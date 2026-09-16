defmodule Operately.Features.ResourceHubLink.CommentsAndNavigationTest do
  use Operately.FeatureCase
  use Operately.Support.ResourceHub.Deletion
  use Operately.Support.ResourceHub.Comments
  use Operately.Support.ResourceHub.Moving

  alias Operately.Support.Features.ResourceHubLinkSteps, as: Steps

  alias Operately.Support.Features.ResourceHubSteps, as: HubSteps

  setup ctx, do: Steps.setup(ctx)

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

  feature "reactions and subscriptions persist across cached navigation", ctx do
    ctx
    |> Steps.visit_resource_hub_page()
    |> Steps.create_link(@link)
    |> HubSteps.set_page_reload_marker()
    |> HubSteps.add_resource_reaction()
    |> HubSteps.reopen_resource_from_list()
    |> HubSteps.assert_resource_reaction()
    |> HubSteps.remove_resource_reaction()
    |> HubSteps.unsubscribe_and_return()
    |> HubSteps.subscribe_and_return()
    |> HubSteps.assert_page_was_not_reloaded()
  end
end
