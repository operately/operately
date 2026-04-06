defmodule OperatelyEmail.Emails.GoalArchivedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    goal = Goals.get_goal!(activity.content["goal_id"])
    space = Operately.Groups.get_group!(goal.group_id)
    company = Repo.preload(author, :company).company

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: space.name, who: author, action: "archived the #{goal.name} goal")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:cta_url, Paths.goal_path(company, goal) |> Paths.to_url())
    |> render("goal_archived")
  end

  def buffered_item(_person, activity) do
    goal = Operately.Goals.get_goal!(activity.content["goal_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    %{
      parent_id: goal.id,
      parent_type: :goal,
      parent_name: goal.name,
      headline: "archived this goal",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
