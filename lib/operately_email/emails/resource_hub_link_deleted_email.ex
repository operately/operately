defmodule OperatelyEmail.Emails.ResourceHubLinkDeletedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.ResourceHubs.Link

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    {:ok, link} = Link.get(:system, id: activity.content["link_id"], opts: [
      preload: [:node, :resource_hub, :space],
      with_deleted: true,
    ])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: link.space.name, who: author, action: "deleted a link: #{link.node.name}")
    |> assign(:author, author)
    |> assign(:link, link)
    |> assign(:cta_url, OperatelyWeb.Paths.resource_hub_path(company, link.resource_hub) |> OperatelyWeb.Paths.to_url())
    |> render("resource_hub_link_deleted")
  end
end
