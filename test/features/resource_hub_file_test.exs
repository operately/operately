defmodule Operately.Features.ResourceHubFileTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ResourceHubSteps, as: Steps
  alias Operately.Support.Features.ResourceHubFileSteps, as: FileSteps

  setup ctx, do: Steps.setup(ctx)

  feature "add comment to file", ctx do
    ctx
    |> FileSteps.given_file_exists()
    |> FileSteps.visit_file_page()
    |> Steps.leave_comment()
    |> Steps.navigate_back("Documents & Files")
    |> Steps.assert_comments_count(%{index: 0, count: "1"})
    |> FileSteps.assert_file_commented_on_company_feed()
    |> FileSteps.assert_file_commented_on_space_feed()
    |> FileSteps.assert_file_commented_notification_sent()
    |> FileSteps.assert_file_commented_email_sent()
  end

  feature "file navigation works", ctx do
    ctx
    |> FileSteps.given_file_within_nested_folders_exists()
    |> FileSteps.visit_file_page()
    |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two", "three", "four", "five"])
    |> Steps.navigate_back("four")
    |> Steps.refute_navigation_links(["four", "five"])
    |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two", "three"])
    |> Steps.navigate_back("Resource hub")
    |> Steps.refute_navigation_links(["Resource hub", "one", "two", "three"])
    |> Steps.assert_navigation_links(["Product Space"])
  end
end
