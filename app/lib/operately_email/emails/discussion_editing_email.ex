defmodule OperatelyEmail.Emails.DiscussionEditingEmail do
  alias Operately.Messages.Message

  def send(_person, _activity) do
    raise "Email for DiscussionEditing not implemented"
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
      headline: "edited the discussion \"#{title}\"",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.message_path(company, message) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
