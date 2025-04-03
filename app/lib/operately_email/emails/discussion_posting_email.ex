defmodule OperatelyEmail.Emails.DiscussionPostingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.Messages.Message

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    {:ok, %{space: space, title: title} = message} = Message.get(:system, id: activity.content["discussion_id"], opts: [
      preload: :space
    ])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: space.name, who: author, action: "posted: #{title}")
    |> assign(:author, author)
    |> assign(:message, message)
    |> assign(:title, title)
    |> assign(:space, space)
    |> assign(:cta_url, OperatelyWeb.Paths.message_path(company, message) |> OperatelyWeb.Paths.to_url())
    |> render("discussion_posting")
  end
end
