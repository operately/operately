defmodule OperatelyEmail.Emails.GoalCheckInCommentedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals, Updates}
  alias Operately.Goals.Update
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])
    {:ok, update} = Update.get(:system, id: activity.content["goal_check_in_id"])
    comment = Updates.get_comment!(activity.content["comment_id"])
    action = "commented on the check-in"

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: goal.name, who: author, action: action)
    |> assign(:action, action)
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:update, update)
    |> assign(:comment, comment)
    |> assign(:link, Paths.goal_check_in_path(company, update, comment) |> Paths.to_url())
    |> render("goal_check_in_commented")
  end

  def buffered_item(_person, activity) do
    goal = Operately.Goals.get_goal!(activity.content["goal_id"])
    comment = Operately.Updates.get_comment!(activity.content["comment_id"])
    content = comment.content["message"]
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    excerpt_html =
      if is_map(content) do
        OperatelyEmail.Templates.rich_text(content) |> Phoenix.HTML.safe_to_string()
      else
        nil
      end

    excerpt_text =
      if is_map(content) do
        Operately.RichContent.rich_content_to_string(content)
        |> String.trim()
      else
        nil
      end

    excerpt_html = if excerpt_html in [nil, ""], do: nil, else: excerpt_html
    excerpt_text = if excerpt_text in [nil, ""], do: nil, else: excerpt_text

    %{
      parent_id: goal.id,
      parent_type: :goal,
      parent_name: goal.name,
      headline: "commented on a goal check-in",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
