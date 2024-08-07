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
    |> from(author)
    |> to(person)
    |> subject(where: space.name, who: author, action: "posted: #{title}")
    |> assign(:author, author)
    |> assign(:discussion, discussion)
    |> assign(:title, title)
    |> assign(:space, space)
    |> assign(:cta_url, OperatelyWeb.Paths.discussion_path(company, discussion) |> OperatelyWeb.Paths.to_url())
    |> render("discussion_posting")
  end
end
