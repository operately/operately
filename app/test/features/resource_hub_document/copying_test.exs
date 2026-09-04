defmodule Operately.Features.ResourceHubDocument.CopyingTest do
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
    document_name = "Q3 Planning Brief"

    new_doc = %{
      name: "Q3 Planning Brief - Copy",
      content: "Content"
    }

    ctx
    |> Steps.given_nested_folders_exist()
    |> Factory.add_document(:document, :hub, folder: :five, name: document_name)
    |> Steps.visit_folder_page(:three)
    |> Steps.assert_document_present_in_files_list("four")
    |> Steps.refute_document_present_in_files_list(document_name)
    |> Steps.visit_folder_page(:five)
    |> Steps.assert_document_present_in_files_list(document_name)
    |> Steps.copy_document_into_folder(document_name)
    |> Steps.visit_folder_page(:three)
    |> Steps.assert_document_present_in_files_list(new_doc.name)
    |> Steps.navigate_to_document(index: 1)
    |> Steps.assert_document_content(new_doc)
  end
end
