defmodule Operately.Features.ResourceHubDocument.AuthoringTest do
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
end
