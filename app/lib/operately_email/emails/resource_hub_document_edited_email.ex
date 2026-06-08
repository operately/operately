defmodule OperatelyEmail.Emails.ResourceHubDocumentEditedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Activities.Notifications.MentionedPeople
  alias Operately.Repo
  alias Operately.ResourceHubs.Document
  alias OperatelyEmail.Emails.ResourceHubParent

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, document} = Document.get(:system, id: activity.content["document_id"], opts: [preload: [:node, resource_hub: [:project, :space]]])
    content = activity.content["content"] || document.content
    parent = ResourceHubParent.from_resource(document)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: parent.name, who: author, action: action(person, document, content))
    |> assign(:author, author)
    |> assign(:document, document)
    |> assign(:content, content)
    |> assign(:cta_url, OperatelyWeb.Paths.document_path(company, document) |> OperatelyWeb.Paths.to_url())
    |> render("resource_hub_document_edited")
  end

  def buffered_item(_person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    {:ok, document} = Document.get(:system, id: activity.content["document_id"], opts: [preload: [:node, resource_hub: [:project, :space]]])
    content = activity.content["content"] || document.content
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(content)

    %{
      headline: "updated the document \"#{document.node.name}\"",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.document_path(company, document) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
    |> Map.merge(ResourceHubParent.fields(document))
  end

  defp action(person, document, content) do
    if person.id in MentionedPeople.ids(content) do
      "mentioned you in the document \"#{document.node.name}\""
    else
      "updated the document \"#{document.node.name}\""
    end
  end
end
