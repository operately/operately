defmodule OperatelyEmail.Emails.DiscussionCommentSubmittedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.Updates

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    discussion = Updates.get_update!(activity.content["discussion_id"])
    comment = Updates.get_comment!(activity.content["comment_id"])
    space = Operately.Groups.get_group!(activity.content["space_id"])
    title = discussion.content["title"]

    company
    |> new()
    |> to(person)
    |> subject(who: author, action: "commented on: #{title}")
    |> assign(:author, author)
    |> assign(:discussion, discussion)
    |> assign(:title, title)
    |> assign(:comment, comment)
    |> assign(:space, space)
    |> render("discussion_comment_submitted")
  end
end
