defmodule Operately.Features.ResourceHubDocument.PageCopyingTest do
  use Operately.FeatureCase
  use Operately.Support.ResourceHub.Deletion
  use Operately.Support.ResourceHub.Comments
  use Operately.Support.ResourceHub.Moving

  alias Operately.Support.Features.ResourceHubDocumentSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @document %{
    name: "My First Document",
    content: "This is the document's content"
  }

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
end
