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

  def buffered_item(_person, activity) do
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    {:ok, %{space: space, title: title} = message} =
      Message.get(:system, id: activity.content["discussion_id"], opts: [preload: :space])

    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(message.body)

    %{
      parent_id: space.id,
      parent_type: :space,
      parent_name: space.name,
      headline: "started the discussion \"#{title}\"",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.message_path(company, message) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
