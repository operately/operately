defmodule OperatelyEmail.Emails.ResourceHubLinkCreatedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.ResourceHubs.Link
  alias OperatelyEmail.Emails.ResourceHubParent

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    {:ok, link} = Link.get(:system, id: activity.content["link_id"], opts: [
      preload: [:node, resource_hub: [:project, :space]],
    ])
    parent = ResourceHubParent.from_resource(link)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: parent.name, who: author, action: "added a link")
    |> assign(:author, author)
    |> assign(:link, link)
    |> assign(:cta_url, OperatelyWeb.Paths.link_path(company, link) |> OperatelyWeb.Paths.to_url())
    |> render("resource_hub_link_created")
  end

  def buffered_item(_person, activity) do
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    {:ok, link} = Link.get(:system, id: activity.content["link_id"], opts: [preload: [:node, resource_hub: [:project, :space]]])
    parent = ResourceHubParent.from_resource(link)

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name,
      headline: "added the link \"#{link.node.name}\"",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.link_path(company, link) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
