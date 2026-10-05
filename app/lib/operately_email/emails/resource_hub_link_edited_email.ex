defmodule OperatelyEmail.Emails.ResourceHubLinkEditedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer

  alias OperatelyEmail.Emails.ResourceHubEmail
  alias Operately.Repo

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    link = ResourceHubEmail.load_link(activity.content["link_id"])
    parent = ResourceHubEmail.parent(link)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(gettext("(%{location}) %{author} edited a link: %{link_name}", location: parent.name, author: Operately.People.Person.short_name(author), link_name: link.name))
    |> assign(:author, author)
    |> assign(:link, link)
    |> assign(:cta_url, OperatelyWeb.Paths.link_path(company, link) |> OperatelyWeb.Paths.to_url())
    |> render("resource_hub_link_edited")
  end

  def buffered_item(_person, activity) do
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    link = ResourceHubEmail.load_link(activity.content["link_id"])
    parent = ResourceHubEmail.parent(link)

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name,
      headline: gettext("edited the link \"%{link_name}\"", link_name: link.name),
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.link_path(company, link) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
