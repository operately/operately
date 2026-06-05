defmodule Operately.Features.ResourceHubDocument.ContentTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ResourceHubDocumentCase

  @document %{
    name: "My First Document",
    content: "This is the document's content"
  }

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
      content: "Brand new content"
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
      content: "Content"
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
end
