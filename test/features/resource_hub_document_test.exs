defmodule Operately.Features.ResourceHubDocumentTest do
  use Operately.FeatureCase
  use Operately.Support.ResourceHub.{Deletion, Comments}

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
    |> Steps.assert_document_edited_notification_sent()
    |> Steps.assert_document_edited_email_sent(new_doc.name)
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
      |> delete_resource_redirects_to_resource_hub()
    end

    feature "deleting document within folder from document page redirects to folder", ctx do
      ctx
      |> Steps.given_document_within_folder_exists()
      |> Steps.visit_document_page()
      |> delete_resource_redirects_to_folder()
    end
  end
end
