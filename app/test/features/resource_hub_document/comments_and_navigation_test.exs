defmodule Operately.Features.ResourceHubDocument.CommentsAndNavigationTest do
  use Operately.FeatureCase
  use Operately.Support.ResourceHub.Deletion
  use Operately.Support.ResourceHub.Comments
  use Operately.Support.ResourceHub.Moving

  alias Operately.Support.Features.ResourceHubDocumentSteps, as: Steps

  alias Operately.Support.Features.ResourceHubSteps, as: HubSteps

  setup ctx, do: Steps.setup(ctx)

  @document %{
    name: "My First Document",
    content: "This is the document's content"
  }

  feature "add comment to document", ctx do
    ctx
    |> Steps.visit_resource_hub_page()
    |> Steps.create_document(@document)
    |> comment_on_resource()
    |> Steps.assert_document_commented_on_company_feed(@document.name)
    |> Steps.assert_document_commented_on_space_feed(@document.name)
    |> Steps.assert_document_commented_notification_sent(@document.name)
    |> Steps.assert_document_commented_email_sent(@document.name)
  end

  feature "delete comment from document", ctx do
    ctx
    |> Steps.visit_resource_hub_page()
    |> Steps.create_document(@document)
    |> Steps.assert_document_content(@document)
    |> leave_one_comment()
    |> delete_comment_on_resource()
    |> Steps.assert_document_commented_on_space_feed(@document.name)
    |> Steps.assert_document_commented_on_company_feed(@document.name)
  end

  feature "document navigation works", ctx do
    ctx
    |> Steps.given_document_within_nested_folders_exists()
    |> Steps.visit_document_page()
    |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two", "three", "four", "five"])
    |> Steps.navigate_back("four")
    |> Steps.refute_navigation_links(["four", "five"])
    |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two", "three"])
    |> Steps.navigate_back("one")
    |> Steps.refute_navigation_links(["one", "two", "three"])
    |> Steps.assert_navigation_links(["Product Space", "Resource hub"])
  end

  feature "reactions and subscriptions persist across cached navigation", ctx do
    ctx
    |> Steps.visit_resource_hub_page()
    |> Steps.create_document(@document)
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
