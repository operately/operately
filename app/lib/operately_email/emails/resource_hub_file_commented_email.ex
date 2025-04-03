defmodule OperatelyEmail.Emails.ResourceHubFileCommentedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias OperatelyWeb.Paths
  alias Operately.{Repo, Updates}
  alias Operately.ResourceHubs.File

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)
    {:ok, file} = File.get(:system, id: activity.content["file_id"], opts: [
      preload: [:node, :space]
    ])
    comment = Updates.get_comment!(activity.content["comment_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: file.space.name, who: author, action: "commented on: #{file.node.name}")
    |> assign(:author, author)
    |> assign(:comment, comment)
    |> assign(:name, file.node.name)
    |> assign(:cta_url, Paths.file_path(company, file, comment) |> Paths.to_url())
    |> render("resource_hub_file_commented")
  end
end
