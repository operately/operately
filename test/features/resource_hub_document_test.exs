defmodule Operately.Features.ResourceHubDocumentTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ResourceHubSteps, as: Steps
  alias Operately.Support.Features.ResourceHubDocumentSteps, as: DocumentSteps

  @document %{
    name: "My First Document",
    content: "This is the document's content",
  }

  setup ctx, do: Steps.setup(ctx)

  feature "create document", ctx do
    ctx
    |> Steps.visit_resource_hub_page()
    |> DocumentSteps.create_document(@document)
    |> DocumentSteps.assert_document_content(@document)
    |> DocumentSteps.assert_document_created_on_space_feed(@document)
    |> DocumentSteps.assert_document_created_on_company_feed(@document)
    |> DocumentSteps.assert_document_created_notification_sent(@document.name)
    |> DocumentSteps.assert_document_created_email_sent(@document.name)
  end

  feature "edit document", ctx do
    new_doc = %{
      name: "Edited name",
      content: "Brand new content",
    }

    ctx
    |> Steps.visit_resource_hub_page()
    |> DocumentSteps.create_document(@document)
    |> DocumentSteps.assert_document_content(@document)
    |> DocumentSteps.edit_document(new_doc)
    |> DocumentSteps.assert_document_content(new_doc)
    |> DocumentSteps.assert_document_edited_on_space_feed(new_doc.name)
    |> DocumentSteps.assert_document_edited_on_company_feed(new_doc.name)
    |> DocumentSteps.assert_document_edited_notification_sent()
    |> DocumentSteps.assert_document_edited_email_sent(new_doc.name)
  end

  feature "editing a document without any changes doesn't make an API call", ctx do
    ctx
    |> Steps.visit_resource_hub_page()
    |> DocumentSteps.create_document(@document)
    |> DocumentSteps.assert_document_content(@document)
    |> DocumentSteps.edit_document(@document)
    |> DocumentSteps.refute_document_edited_on_space_feed(@document.name)
    |> DocumentSteps.refute_document_edited_on_company_feed(@document.name)
  end

  feature "delete document from content list", ctx do
    ctx
    |> Steps.visit_resource_hub_page()
    |> DocumentSteps.create_document(@document)
    |> DocumentSteps.assert_document_content(@document)
    |> Steps.navigate_back("Documents & Files")
    |> Steps.delete_document(@document.name)
    |> Steps.assert_document_deleted(@document.name)
    |> Steps.assert_document_deleted_on_space_feed(@document.name)
    |> Steps.assert_document_deleted_on_company_feed(@document.name)
    |> Steps.assert_document_deleted_notification_sent(@document.name)
    |> Steps.assert_document_deleted_email_sent(@document.name)
  end

  feature "deleting document from document page redirects to resource hub", ctx do
    ctx
    |> Steps.visit_resource_hub_page()
    |> DocumentSteps.create_document(@document)
    |> DocumentSteps.assert_document_content(@document)
    |> Steps.delete_document()
    |> Steps.assert_page_is_resource_hub_root(name: "Documents & Files")
    |> Steps.assert_zero_state()
  end

  feature "deleting document within folder from document page redirects to folder", ctx do
    ctx
    |> DocumentSteps.given_document_within_nested_folders_exists()
    |> DocumentSteps.visit_document_page()
    |> Steps.delete_document()
    |> Steps.assert_page_is_folder_root(folder_key: :five)
    |> Steps.assert_zero_folder_state()
  end

  feature "copy document in the same folder", ctx do
    new_name = "Document - Copy"

    ctx
    |> Steps.visit_resource_hub_page()
    |> DocumentSteps.create_document(@document)
    |> Steps.visit_resource_hub_page()
    |> DocumentSteps.copy_document(new_name)
    |> Steps.visit_resource_hub_page()
    |> DocumentSteps.assert_document_present_in_files_list(new_name)
    |> DocumentSteps.assert_document_copied_on_company_feed(%{name: @document.name, new_name: new_name})
    |> DocumentSteps.assert_document_copied_on_space_feed(%{name: @document.name, new_name: new_name})
    |> DocumentSteps.assert_document_copied_notification_sent(%{name: @document.name, new_name: new_name})
    |> DocumentSteps.assert_document_copied_email_sent(new_name)
  end

  feature "add comment to document", ctx do
    ctx
    |> Steps.visit_resource_hub_page()
    |> DocumentSteps.create_document(@document)
    |> Steps.leave_comment()
    |> Steps.leave_comment()
    |> Steps.navigate_back("Documents & Files")
    |> Steps.assert_comments_count(%{index: 0, count: "2"})
    |> DocumentSteps.assert_document_commented_on_company_feed(@document.name)
    |> DocumentSteps.assert_document_commented_on_space_feed(@document.name)
    |> DocumentSteps.assert_document_commented_notification_sent(@document.name)
    |> DocumentSteps.assert_document_commented_email_sent(@document.name)
  end

  feature "document navigation works", ctx do
    ctx
    |> DocumentSteps.given_document_within_nested_folders_exists()
    |> DocumentSteps.visit_document_page()
    |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two", "three", "four", "five"])
    |> Steps.navigate_back("four")
    |> Steps.refute_navigation_links(["four", "five"])
    |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two", "three"])
    |> Steps.navigate_back("one")
    |> Steps.refute_navigation_links(["one", "two", "three"])
    |> Steps.assert_navigation_links(["Product Space", "Resource hub"])
  end
end
