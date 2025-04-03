defmodule OperatelyEmail.Emails.DiscussionCommentSubmittedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.Updates
  alias OperatelyWeb.Paths
  alias Operately.Messages.Message

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    {:ok, %{title: title} = message} = Message.get(:system, id: activity.content["discussion_id"])
    comment = Updates.get_comment!(activity.content["comment_id"])
    space = Operately.Groups.get_group!(activity.content["space_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: space.name, who: author, action: "commented on: #{title}")
    |> assign(:author, author)
    |> assign(:discussion, message)
    |> assign(:title, title)
    |> assign(:comment, comment)
    |> assign(:space, space)
    |> assign(:cta_url, Paths.message_path(company, message, comment) |> Paths.to_url())
    |> render("discussion_comment_submitted")
  end
end
