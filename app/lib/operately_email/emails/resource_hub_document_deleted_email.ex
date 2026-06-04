defmodule OperatelyEmail.Emails.ResourceHubDocumentDeletedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.ResourceHubs.Document
  alias OperatelyEmail.Emails.ResourceHubParent

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    {:ok, document} = Document.get(:system, id: activity.content["document_id"], opts: [
      preload: [:node, resource_hub: [:project, :space]],
      with_deleted: true,
    ])
    parent = ResourceHubParent.from_resource(document)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: parent.name, who: author, action: "deleted a document: #{document.node.name}")
    |> assign(:author, author)
    |> assign(:document, document)
    |> assign(:cta_url, OperatelyWeb.Paths.resource_hub_path(company, document.resource_hub) |> OperatelyWeb.Paths.to_url())
    |> render("resource_hub_document_deleted")
  end

  def buffered_item(_person, activity) do
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    {:ok, document} =
      Document.get(:system, id: activity.content["document_id"], opts: [preload: [:node, resource_hub: [:project, :space]], with_deleted: true])

    %{
      headline: "deleted the document \"#{document.node.name}\"",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.resource_hub_path(company, document.resource_hub) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
    |> Map.merge(ResourceHubParent.fields(document))
  end
end
