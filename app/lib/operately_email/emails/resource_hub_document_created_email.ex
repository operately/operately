defmodule OperatelyEmail.Emails.ResourceHubDocumentCreatedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias OperatelyEmail.Emails.ResourceHubEmail
  alias Operately.Repo
  alias Operately.ResourceHubs.Document

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    document = ResourceHubEmail.load_document(activity.content["document_id"])
    parent = ResourceHubEmail.parent(document)

    copied_document = get_copied_document(activity.content["copied_document_id"])
    action = get_action(activity.content["copied_document_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: parent.name, who: author, action: "#{action} a document: #{document.node.name}")
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

  def buffered_item(_person, activity) do
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    document = ResourceHubEmail.load_document(activity.content["document_id"])
    parent = ResourceHubEmail.parent(document)

    action = get_action(activity.content["copied_document_id"])

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name,
      headline: "#{action} the document \"#{document.node.name}\"",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.document_path(company, document) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
