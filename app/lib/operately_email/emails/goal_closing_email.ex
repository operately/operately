defmodule OperatelyEmail.Emails.GoalClosingEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])
    space = Operately.Groups.get_group!(goal.group_id)
    activity = Operately.Repo.preload(activity, :comment_thread)
    link = Paths.goal_activity_path(company, activity) |> Paths.to_url()

    success = activity.content["success"]
    message = activity.comment_thread.message

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: space.name, who: author, action: "closed the #{goal.name} goal")
    |> assign(:goal, goal)
    |> assign(:author, author)
    |> assign(:link, link)
    |> assign(:success, success)
    |> assign(:message, message)
    |> render("goal_closing")
  end

  def buffered_item(_person, activity) do
    goal = Operately.Goals.get_goal!(activity.content["goal_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    %{
      parent_id: goal.id,
      parent_type: :goal,
      parent_name: goal.name,
      headline: "closed this goal",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
