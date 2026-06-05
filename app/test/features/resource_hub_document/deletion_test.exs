defmodule Operately.Features.ResourceHubDocument.DeletionTest do
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
end
