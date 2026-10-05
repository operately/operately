defmodule OperatelyEmail.Emails.GoalCreatedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}
  alias Operately.People.Person
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])
    role = Goals.get_role(goal, person) |> role_label()
    space = Operately.Groups.get_group!(goal.group_id)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(gettext("(%{space_name}) %{author} added the %{goal_name} goal", space_name: space.name, author: Operately.People.Person.short_name(author), goal_name: goal.name))
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:role, role)
    |> assign(:cta_url, Paths.goal_path(company, goal) |> Paths.to_url())
    |> render("goal_created")
  end

  defp role_label(:champion), do: gettext("champion")
  defp role_label(:reviewer), do: gettext("reviewer")
  defp role_label(role), do: Atom.to_string(role)

  def buffered_item(_person, activity) do
    goal = Goals.get_goal!(activity.content["goal_id"])
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    %{
      parent_id: goal.id,
      parent_type: :goal,
      parent_name: goal.name,
      headline: gettext("created the goal"),
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: Paths.goal_path(company, goal) |> Paths.to_url(),
      actor_name: Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
