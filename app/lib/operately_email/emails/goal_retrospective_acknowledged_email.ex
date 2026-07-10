defmodule OperatelyEmail.Emails.GoalRetrospectiveAcknowledgedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals, Activities}
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    goal = Goals.get_goal!(activity.content["goal_id"])
    company = Repo.preload(author, :company).company
    retrospective_activity = Activities.get_activity!(activity.content["retrospective_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: goal.name, who: author, action: "acknowledged your retrospective")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:cta_url, Paths.goal_activity_path(company, retrospective_activity) |> Paths.to_url())
    |> render("goal_retrospective_acknowledged")
  end

  def buffered_item(_person, activity) do
    goal = Operately.Goals.get_goal!(activity.content["goal_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    %{
      parent_id: goal.id,
      parent_type: :goal,
      parent_name: goal.name,
      headline: "acknowledged a goal retrospective",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
