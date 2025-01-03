defmodule OperatelyEmail.Emails.ResourceHubDocumentEditedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.ResourceHubs.Document

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    {:ok, document} = Document.get(:system, id: activity.content["document_id"], opts: [
      preload: [:node, :space],
    ])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: document.space.name, who: author, action: "edited a document: #{document.node.name}")
    |> assign(:author, author)
    |> assign(:document, document)
    |> assign(:cta_url, OperatelyWeb.Paths.document_path(company, document) |> OperatelyWeb.Paths.to_url())
    |> render("resource_hub_document_edited")
  end
end
