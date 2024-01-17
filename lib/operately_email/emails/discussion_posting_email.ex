defmodule OperatelyEmail.Emails.DiscussionPostingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.Updates

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    discussion = Updates.get_update!(activity.content["discussion_id"])
    company = Repo.preload(author, :company).company
    space = Operately.Groups.get_group!(activity.content["space_id"])
    title = discussion.content["title"]

    company
    |> new()
    |> to(person)
    |> subject(who: author, action: "posted: #{title}")
    |> assign(:author, author)
    |> assign(:discussion, discussion)
    |> assign(:title, title)
    |> assign(:space, space)
    |> render("discussion_posting")
  end
end
