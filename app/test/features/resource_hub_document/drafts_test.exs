defmodule Operately.Features.ResourceHubDocument.DraftsTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ResourceHubDocumentCase

  @document %{
    name: "My First Document",
    content: "This is the document's content"
  }

  describe "Drafts" do
    feature "Link to continue editing single draft is displayed", ctx do
      ctx
      |> Steps.given_a_single_draft_document_exists()
      |> Steps.visit_resource_hub_page("Resource hub")
      |> Steps.assert_single_draft_document_link_is_visible()
      |> Steps.assert_draft_document_not_visible_and_state_is_zero()
      |> Steps.click_on_continue_writing_draft_link()
      |> Steps.assert_page_is_document_editing()
    end

    feature "Cancel draft document editing returns to document page", ctx do
      ctx
      |> Steps.given_a_single_draft_document_exists()
      |> Steps.visit_document_page()
      |> Steps.assert_document_is_draft()
      |> Steps.cancel_draft_document_editing()
      |> Steps.assert_page_is_document_page()
    end

    feature "Link to continue editing several drafts is displayed", ctx do
      ctx
      |> Steps.given_several_draft_documents_exist()
      |> Steps.visit_resource_hub_page("Resource hub")
      |> Steps.assert_several_draft_documents_link_is_visible()
      |> Steps.assert_draft_document_not_visible_and_state_is_zero()
      |> Steps.click_on_continue_writing_draft_link()
      |> Steps.assert_page_is_resource_hub_drafts()
      |> Steps.assert_document_present_in_files_list("First Draft")
      |> Steps.assert_document_present_in_files_list("Second Draft")
      |> Steps.assert_document_present_in_files_list("Third Draft")
    end

    feature "Create draft document", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_draft_document(@document)
      |> Steps.assert_page_is_document_page()
      |> Steps.assert_document_is_draft()
      |> Steps.assert_draft_actions_on_the_page()
      |> Steps.visit_resource_hub_page()
      |> Steps.assert_draft_document_not_visible_and_state_is_zero()
    end

    feature "Draft document can be published", ctx do
      ctx
      |> Steps.given_a_single_draft_document_exists()
      |> Steps.visit_resource_hub_page("Resource hub")
      |> Steps.assert_draft_document_not_visible_and_state_is_zero()
      |> Steps.visit_document_page()
      |> Steps.publish_document()
      |> Steps.visit_resource_hub_page("Resource hub")
      |> Steps.assert_document_present_in_files_list("Document")
    end

    feature "Draft document can be edited and published", ctx do
      new_doc = %{
        name: "Edited draft",
        content: "Edited draft content"
      }

      ctx
      |> Steps.given_a_single_draft_document_exists()
      |> Steps.visit_resource_hub_page("Resource hub")
      |> Steps.assert_draft_document_not_visible_and_state_is_zero()
      |> Steps.visit_document_page()
      |> Steps.edit_and_publish_document(new_doc)
      |> Steps.assert_document_content(new_doc)
      |> Steps.visit_resource_hub_page("Resource hub")
      |> Steps.assert_document_present_in_files_list(new_doc.name)
    end

    feature "Edit subscriptions when publishing draft", ctx do
      ctx
      |> Steps.given_members_exist()
      |> Steps.given_a_single_draft_document_exists()
      |> Steps.visit_resource_hub_page("Resource hub")
      |> Steps.assert_draft_document_not_visible_and_state_is_zero()
      |> Steps.visit_document_page()
      |> Steps.click_continue_editing()
      |> Steps.select_people_to_notify()
      |> Steps.click_publish_now()
      |> Steps.assert_subscribers()
    end

    feature "Feed event is created only when draft is published", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_draft_document(@document)
      |> Steps.refute_document_created_on_space_feed(@document)
      |> Steps.refute_document_created_on_company_feed(@document)
      |> Steps.visit_document_page()
      |> Steps.publish_document()
      |> Steps.assert_document_created_on_space_feed(@document)
      |> Steps.assert_document_created_on_company_feed(@document)
    end
  end
end
