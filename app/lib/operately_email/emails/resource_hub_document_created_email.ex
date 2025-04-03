defmodule OperatelyEmail.Emails.ResourceHubDocumentCreatedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.ResourceHubs.Document

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    {:ok, document} = Document.get(:system, id: activity.content["document_id"], opts: [
      preload: [:node, :space],
    ])

    copied_document = get_copied_document(activity.content.copied_document_id)
    action = get_action(activity.content.copied_document_id)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: document.space.name, who: author, action: "#{action} a document: #{document.node.name}")
    |> assign(:author, author)
    |> assign(:document, document)
    |> assign(:copied_document, copied_document)
    |> assign(:cta_url, OperatelyWeb.Paths.document_path(company, document) |> OperatelyWeb.Paths.to_url())
    |> render("resource_hub_document_created")
  end

  defp get_action(nil), do: "added"
  defp get_action(_), do: "copied"

  defp get_copied_document(nil), do: nil
  defp get_copied_document(id) do
    {:ok, copied_document} = Document.get(:system, id: id, opts: [preload: :node])
    copied_document
  end
end
