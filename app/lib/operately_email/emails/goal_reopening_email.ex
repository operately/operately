defmodule OperatelyEmail.Emails.GoalReopeningEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])
    space = Operately.Groups.get_group!(goal.group_id)
    link = OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url()
    message = Operately.Repo.preload(activity, :comment_thread).comment_thread.message

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: space.name, who: author, action: "reopened the #{goal.name} goal")
    |> assign(:goal, goal)
    |> assign(:author, author)
    |> assign(:link, link)
    |> assign(:message, message)
    |> render("goal_reopening")
  end

  def buffered_item(_person, activity) do
    goal = Operately.Goals.get_goal!(activity.content["goal_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    %{
      parent_id: goal.id,
      parent_type: :goal,
      parent_name: goal.name,
      headline: "reopened this goal",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
