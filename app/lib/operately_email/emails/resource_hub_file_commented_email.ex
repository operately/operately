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

  def buffered_item(_person, activity) do
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    {:ok, file} = File.get(:system, id: activity.content["file_id"], opts: [preload: [:node, :space]])
    comment = Updates.get_comment!(activity.content["comment_id"])
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(comment.content["message"])

    %{
      parent_id: file.space.id,
      parent_type: :space,
      parent_name: file.space.name,
      headline: "commented on the file \"#{file.node.name}\"",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: Paths.file_path(company, file, comment) |> Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
