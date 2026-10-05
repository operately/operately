defmodule OperatelyEmail.Emails.ResourceHubLinkCommentedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer

  alias OperatelyEmail.Emails.ResourceHubEmail
  alias OperatelyWeb.Paths
  alias Operately.{Repo, Updates}

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)
    link = ResourceHubEmail.load_link(activity.content["link_id"])
    parent = ResourceHubEmail.parent(link)

    comment = Updates.get_comment!(activity.content["comment_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(gettext("(%{location}) %{author} commented on: %{link_name}", location: parent.name, author: Operately.People.Person.short_name(author), link_name: link.name))
    |> assign(:author, author)
    |> assign(:comment, comment)
    |> assign(:name, link.name)
    |> assign(:cta_url, Paths.link_path(company, link, comment) |> Paths.to_url())
    |> render("resource_hub_link_commented")
  end

  def buffered_item(_person, activity) do
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    link = ResourceHubEmail.load_link(activity.content["link_id"])
    parent = ResourceHubEmail.parent(link)
    comment = Updates.get_comment!(activity.content["comment_id"])
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(comment.content)

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name,
      headline: "commented on the link \"#{link.name}\"",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: Paths.link_path(company, link, comment) |> Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
