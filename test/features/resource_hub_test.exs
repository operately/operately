defmodule Operately.Features.ResourceHubTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ResourceHubSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "comments" do
    feature "add comment to file", ctx do
      ctx
      |> Steps.given_file_exists()
      |> Steps.visit_file_page()
      |> Steps.leave_comment()
      |> Steps.navigate_back("Documents & Files")
      |> Steps.assert_comments_count(%{index: 0, count: "1"})
      |> Steps.assert_file_commented_on_company_feed()
      |> Steps.assert_file_commented_on_space_feed()
      |> Steps.assert_file_commented_notification_sent()
      |> Steps.assert_file_commented_email_sent()
    end
  end

  describe "navigation" do
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
end
