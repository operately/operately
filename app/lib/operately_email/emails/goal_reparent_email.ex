defmodule OperatelyEmail.Emails.GoalReparentEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])
    new_parent_goal = activity.content["new_parent_goal_id"] && Goals.get_goal!(activity.content["new_parent_goal_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: goal.name, who: author, action: "changed the goal parent of #{goal.name}")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:new_parent_goal, new_parent_goal)
    |> assign(:cta_url, OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url())
    |> render("goal_reparent")
  end

  def buffered_item(_person, activity) do
    goal = Operately.Goals.get_goal!(activity.content["goal_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    new_parent_goal = activity.content["new_parent_goal_id"] && Operately.Goals.get_goal!(activity.content["new_parent_goal_id"])

    %{
      parent_id: goal.id,
      parent_type: :goal,
      parent_name: goal.name,
      headline: buffered_headline(new_parent_goal),
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end

  defp buffered_headline(nil), do: "removed the goal's parent"
  defp buffered_headline(parent_goal), do: "changed the goal's parent to \"#{parent_goal.name}\""
end
