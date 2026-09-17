defmodule Operately.Features.ResourceHubFile.ActionsTest do
  use Operately.FeatureCase
  use Operately.Support.ResourceHub.Deletion
  use Operately.Support.ResourceHub.Comments
  use Operately.Support.ResourceHub.Moving

  alias Operately.Support.Features.ResourceHubFileSteps, as: Steps

  alias Operately.Support.Features.ResourceHubSteps, as: HubSteps

  setup ctx, do: Steps.setup(ctx)

  describe "File actions" do
    @original_file_attrs %{
      title: "Some File",
      description: "Content"
    }
    @new_file_attrs %{
      original_title: "Some File",
      title: "Edited title",
      description: "This is an edited description"
    }

    feature "edit file", ctx do
      ctx
      |> Steps.given_file_exists()
      |> Steps.visit_file_page()
      |> Steps.assert_file_content(@original_file_attrs)
      |> HubSteps.set_page_reload_marker()
      |> Steps.edit_file(@new_file_attrs)
      |> HubSteps.assert_page_was_not_reloaded()
      |> Steps.assert_file_content(@new_file_attrs)
    end

    feature "edit file from files list", ctx do
      ctx
      |> Steps.given_file_exists()
      |> Steps.visit_resource_hub_page()
      |> Steps.edit_file_from_files_list(@new_file_attrs)
      |> Steps.assert_file_content(@new_file_attrs)
    end

    feature "add comment to file", ctx do
      ctx
      |> Steps.given_file_exists()
      |> Steps.visit_file_page()
      |> comment_on_resource()
      |> Steps.assert_file_commented_on_company_feed()
      |> Steps.assert_file_commented_on_space_feed()
      |> Steps.assert_file_commented_notification_sent()
      |> Steps.assert_file_commented_email_sent()
    end

    feature "delete comment from file", ctx do
      ctx
      |> Steps.given_file_exists()
      |> Steps.visit_file_page()
      |> leave_one_comment()
      |> delete_comment_on_resource()
      |> Steps.assert_file_commented_on_space_feed()
      |> Steps.assert_file_commented_on_company_feed()
    end

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

  feature "reactions and subscriptions persist across cached navigation", ctx do
    ctx
    |> Steps.given_file_exists()
    |> Steps.visit_file_page()
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
