defmodule OperatelyEmail.Emails.ResourceHubLinkEditedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.ResourceHubs.Link

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    {:ok, link} = Link.get(:system, id: activity.content["link_id"], opts: [
      preload: [:space, :node]
    ])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: link.space.name, who: author, action: "edited a link: #{link.node.name}")
    |> assign(:author, author)
    |> assign(:link, link)
    |> assign(:cta_url, OperatelyWeb.Paths.link_path(company, link) |> OperatelyWeb.Paths.to_url())
    |> render("resource_hub_link_edited")
  end
end
