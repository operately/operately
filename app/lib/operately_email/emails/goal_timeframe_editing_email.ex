defmodule OperatelyEmail.Emails.GoalTimeframeEditingEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])

    message = Operately.Repo.preload(activity, :comment_thread).comment_thread.message
    link = OperatelyWeb.Paths.goal_activity_path(company, activity) |> OperatelyWeb.Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: goal.name, who: author, action: "edited the timeframe")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:old_timeframe, activity.content.old_timeframe)
    |> assign(:new_timeframe, activity.content.new_timeframe)
    |> assign(:message, message)
    |> assign(:link, link)
    |> render("goal_timeframe_editing")
  end

  def buffered_item(_person, activity) do
    goal = Operately.Goals.get_goal!(activity.content["goal_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    %{
      parent_id: goal.id,
      parent_type: :goal,
      parent_name: goal.name,
      headline: "updated this goal timeframe",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
