defmodule OperatelyEmail.Emails.ResourceHubDocumentCommentedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer

  alias OperatelyEmail.Emails.ResourceHubEmail
  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Updates.Comment

  def send(person, activity) do
    case Repo.get(Comment, activity.content["comment_id"]) do
      nil -> :skip
      comment -> send_email(person, activity, comment)
    end
  end

  defp send_email(person, activity, comment) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)
    document = ResourceHubEmail.load_document(activity.content["document_id"])
    parent = ResourceHubEmail.parent(document)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(gettext("(%{location}) %{author} commented on: %{document_name}", location: parent.name, author: Operately.People.Person.short_name(author), document_name: document.name))
    |> assign(:author, author)
    |> assign(:comment, comment)
    |> assign(:name, document.name)
    |> assign(:cta_url, Paths.document_path(company, document, comment) |> Paths.to_url())
    |> render("resource_hub_document_commented")
  end

  def buffered_item(_person, activity) do
    case Repo.get(Comment, activity.content["comment_id"]) do
      nil -> :skip
      comment -> build_buffered_item(activity, comment)
    end
  end

  defp build_buffered_item(activity, comment) do
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    document = ResourceHubEmail.load_document(activity.content["document_id"])
    parent = ResourceHubEmail.parent(document)
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(comment.content)

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name,
      headline: gettext("commented on the document \"%{document_name}\"", document_name: document.name),
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: Paths.document_path(company, document, comment) |> Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
