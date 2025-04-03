defmodule OperatelyEmail.Emails.ResourceHubLinkCommentedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias OperatelyWeb.Paths
  alias Operately.{Repo, Updates}
  alias Operately.ResourceHubs.Link

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)
    {:ok, link} = Link.get(:system, id: activity.content["link_id"], opts: [
      preload: [:node, :space]
    ])

    comment = Updates.get_comment!(activity.content["comment_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: link.space.name, who: author, action: "commented on: #{link.node.name}")
    |> assign(:author, author)
    |> assign(:comment, comment)
    |> assign(:name, link.node.name)
    |> assign(:cta_url, Paths.link_path(company, link, comment) |> Paths.to_url())
    |> render("resource_hub_link_commented")
  end
end
