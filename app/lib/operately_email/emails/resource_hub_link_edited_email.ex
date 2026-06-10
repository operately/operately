defmodule OperatelyEmail.Emails.ResourceHubLinkEditedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.ResourceHubs.Link
  alias OperatelyEmail.Emails.ResourceHubParent

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    {:ok, link} = Link.get(:system, id: activity.content["link_id"], opts: [
      preload: [:node, resource_hub: [:project, :space]]
    ])
    parent = ResourceHubParent.from_resource(link)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: parent.name, who: author, action: "edited a link: #{link.node.name}")
    |> assign(:author, author)
    |> assign(:link, link)
    |> assign(:cta_url, OperatelyWeb.Paths.link_path(company, link) |> OperatelyWeb.Paths.to_url())
    |> render("resource_hub_link_edited")
  end

  def buffered_item(_person, activity) do
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    {:ok, link} = Link.get(:system, id: activity.content["link_id"], opts: [preload: [:node, resource_hub: [:project, :space]]])

    %{
      headline: "edited the link \"#{link.node.name}\"",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.link_path(company, link) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
    |> Map.merge(ResourceHubParent.fields(link))
  end
end
