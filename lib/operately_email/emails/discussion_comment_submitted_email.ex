defmodule OperatelyEmail.Emails.DiscussionCommentSubmittedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.Updates
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    discussion = Updates.get_update!(activity.content["discussion_id"])
    comment = Updates.get_comment!(activity.content["comment_id"])
    space = Operately.Groups.get_group!(activity.content["space_id"])
    title = discussion.content["title"]

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: space.name, who: author, action: "commented on: #{title}")
    |> assign(:author, author)
    |> assign(:discussion, discussion)
    |> assign(:title, title)
    |> assign(:comment, comment)
    |> assign(:space, space)
    |> assign(:cta_url, Paths.discussion_path(company, discussion) |> Paths.to_url())
    |> render("discussion_comment_submitted")
  end
end
