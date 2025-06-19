defmodule Operately.Features.ResourceHubDocumentTest do
  use Operately.FeatureCase
  use Operately.Support.ResourceHub.{Deletion, Comments, Moving}

  alias Operately.Support.Features.ResourceHubDocumentSteps, as: Steps

  @document %{
    name: "My First Document",
    content: "This is the document's content",
  }

  setup ctx, do: Steps.setup(ctx)

  feature "create document", ctx do
    ctx
    |> Steps.visit_resource_hub_page()
    |> Steps.create_document(@document)
    |> Steps.assert_document_content(@document)
    |> Steps.assert_document_created_on_space_feed(@document)
    |> Steps.assert_document_created_on_company_feed(@document)
    |> Steps.assert_document_created_notification_sent(@document.name)
    |> Steps.assert_document_created_email_sent(@document.name)
  end

  feature "edit document", ctx do
    new_doc = %{
      name: "Edited name",
      content: "Brand new content",
    }

    ctx
    |> Steps.visit_resource_hub_page()
    |> Steps.create_document(@document)
    |> Steps.assert_document_content(@document)
    |> Steps.edit_document(new_doc)
    |> Steps.assert_document_content(new_doc)
    |> Steps.assert_document_edited_on_space_feed(new_doc.name)
    |> Steps.assert_document_edited_on_company_feed(new_doc.name)
  end

  feature "editing a document without any changes doesn't make an API call", ctx do
    ctx
    |> Steps.visit_resource_hub_page()
    |> Steps.create_document(@document)
    |> Steps.assert_document_content(@document)
    |> Steps.edit_document(@document)
    |> Steps.refute_document_edited_on_space_feed(@document.name)
    |> Steps.refute_document_edited_on_company_feed(@document.name)
  end

  feature "cancel document editing returns to document page", ctx do
    ctx
    |> Steps.visit_resource_hub_page()
    |> Steps.create_document(@document)
    |> Steps.assert_document_content(@document)
    |> Steps.cancel_document_editing()
    |> Steps.assert_page_is_document_page()
  end

  feature "copy document in the same folder", ctx do
    new_name = "Document - Copy"

    ctx
    |> Steps.visit_resource_hub_page()
    |> Steps.create_document(@document)
    |> Steps.visit_resource_hub_page()
    |> Steps.copy_document(new_name)
    |> Steps.visit_resource_hub_page()
    |> Steps.assert_document_present_in_files_list(new_name)
    |> Steps.assert_document_copied_on_company_feed(%{name: @document.name, new_name: new_name})
    |> Steps.assert_document_copied_on_space_feed(%{name: @document.name, new_name: new_name})
    |> Steps.assert_document_copied_notification_sent(%{name: @document.name, new_name: new_name})
    |> Steps.assert_document_copied_email_sent(new_name)
  end

  feature "copy document into another folder", ctx do
    document_name = "Document"
    new_doc = %{
      name: "Document - Copy",
      content: "Content",
    }

    ctx
    |> Steps.given_document_within_nested_folders_exists()
    |> Steps.visit_folder_page(:three)
    |> Steps.refute_document_present_in_files_list(document_name)
    |> Steps.visit_folder_page(:five)
    |> Steps.assert_document_present_in_files_list(document_name)
    |> Steps.copy_document_into_folder(document_name)
    |> Steps.visit_folder_page(:three)
    |> Steps.assert_document_present_in_files_list(new_doc.name)
    |> Steps.navigate_to_document(index: 1)
    |> Steps.assert_document_content(new_doc)
  end

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
        content: "Edited draft content",
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

  describe "Delete" do
    feature "deleting document adds event to feed", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(@document)
      |> Steps.assert_document_content(@document)
      |> delete_resource_from_nodes_list(@document.name)
      |> Steps.assert_document_deleted_on_space_feed(@document.name)
      |> Steps.assert_document_deleted_on_company_feed(@document.name)
    end

    feature "deleting document sends notifications", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(@document)
      |> Steps.assert_document_content(@document)
      |> delete_resource_from_nodes_list(@document.name)
      |> Steps.assert_document_deleted_notification_sent(@document.name)
      |> Steps.assert_document_deleted_email_sent(@document.name)
    end

    feature "delete document from content list", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(@document)
      |> Steps.assert_document_content(@document)
      |> delete_resource_from_nodes_list(@document.name)
    end

    feature "deleting document from document page redirects to resource hub", ctx do
      ctx
      |> Steps.given_document_within_resource_hub_root_exists()
      |> Steps.visit_document_page()
      |> delete_resource_redirects_to_resource_hub("Resource hub")
    end

    feature "deleting document within folder from document page redirects to folder", ctx do
      ctx
      |> Steps.given_document_within_folder_exists()
      |> Steps.visit_document_page()
      |> delete_resource_redirects_to_folder()
    end
  end

  describe "Copy" do
    feature "Copy document from document page to resource hub root", ctx do
      new_name = "Document - Copy from Page"

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(@document)
      |> Steps.visit_document_page()
      |> Steps.copy_document_from_document_page(new_name)
      |> Steps.visit_resource_hub_page()
      |> Steps.assert_document_present_in_files_list(new_name)
      |> Steps.assert_document_copied_on_company_feed(%{name: @document.name, new_name: new_name})
      |> Steps.assert_document_copied_on_space_feed(%{name: @document.name, new_name: new_name})
      |> Steps.assert_document_copied_notification_sent(%{name: @document.name, new_name: new_name})
      |> Steps.assert_document_copied_email_sent(new_name)
    end

    feature "Copy document from resource hub root to folder", ctx do
      new_name = "Document - Copy to Folder"

      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.given_document_within_resource_hub_root_exists(:hub)
      |> Steps.visit_document_page()
      |> Steps.copy_document_from_document_page_into_folder(new_name)
      |> Steps.visit_folder_page(:one)
      |> Steps.assert_document_present_in_files_list(new_name)
    end

    feature "Copy document from folder to resource hub root", ctx do
      new_name = "Document - Copy to Root"

      ctx
      |> Steps.given_document_within_folder_exists()
      |> Steps.visit_document_page()
      |> Steps.copy_document_from_document_page_into_hub_root(new_name)
      |> Steps.visit_resource_hub_page("Resource hub")
      |> Steps.assert_document_present_in_files_list(new_name)
    end
  end

  describe "Move" do
    @resource_name "Document"

    feature "Moving document to child folder", ctx do
      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.given_document_within_resource_hub_root_exists(:hub)
      |> move_resource_to_child_folder(resource_name: @resource_name)
    end

    feature "Moving document to parent folder", ctx do
      ctx
      |> Steps.given_document_within_nested_folders_exists()
      |> move_resource_to_parent_folder(resource_name: @resource_name)
    end

    feature "Moving document to resource hub root", ctx do
      ctx
      |> Steps.given_document_within_nested_folders_exists()
      |> move_resource_to_hub_root(resource_name: @resource_name)
    end
  end
end
