defmodule OperatelyEmail.Emails.ResourceHubDocumentDeletedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.ResourceHubs.Document

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    {:ok, document} = Document.get(:system, id: activity.content["document_id"], opts: [
      preload: [:node, :space, :resource_hub],
      with_deleted: true,
    ])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: document.space.name, who: author, action: "deleted a document: #{document.node.name}")
    |> assign(:author, author)
    |> assign(:document, document)
    |> assign(:cta_url, OperatelyWeb.Paths.resource_hub_path(company, document.resource_hub) |> OperatelyWeb.Paths.to_url())
    |> render("resource_hub_document_deleted")
  end
end
