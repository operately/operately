defmodule Operately.Features.ResourceHubDocument.ResourceManagementTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ResourceHubDocumentCase

  @document %{
    name: "My First Document",
    content: "This is the document's content"
  }

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
