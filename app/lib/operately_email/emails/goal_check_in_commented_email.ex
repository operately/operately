defmodule OperatelyEmail.Emails.GoalCheckInCommentedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}
  alias Operately.Goals.Update
  alias Operately.Updates.Comment
  alias OperatelyWeb.Paths

  def send(person, activity) do
    case Repo.get(Comment, activity.content["comment_id"]) do
      nil -> :skip
      comment -> send_email(person, activity, comment)
    end
  end

  defp send_email(person, activity, comment) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])
    {:ok, update} = Update.get(:system, id: activity.content["goal_check_in_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(gettext("(%{location}) %{author} commented on the check-in", location: goal.name, author: Operately.People.Person.short_name(author)))
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:update, update)
    |> assign(:comment, comment)
    |> assign(:link, Paths.goal_check_in_path(company, update, comment) |> Paths.to_url())
    |> render("goal_check_in_commented")
  end

  def buffered_item(_person, activity) do
    case Repo.get(Comment, activity.content["comment_id"]) do
      nil -> :skip
      comment -> build_buffered_item(activity, comment)
    end
  end

  defp build_buffered_item(activity, comment) do
    goal = Operately.Goals.get_goal!(activity.content["goal_id"])
    content = comment.content
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(content)

    %{
      parent_id: goal.id,
      parent_type: :goal,
      parent_name: goal.name,
      headline: gettext("commented on a goal check-in"),
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
