defmodule OperatelyEmail.Emails.GoalReviewerUpdatingEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.{Repo, Goals}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(gettext("(%{goal_name}) %{author} assigned you as the reviewer", goal_name: goal.name, author: Operately.People.Person.short_name(author)))
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:link, OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url())
    |> render("goal_reviewer_updating")
  end

  def buffered_item(_person, activity) do
    goal = Operately.Goals.get_goal!(activity.content["goal_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    reviewer = get_reviewer(activity.content["new_reviewer_id"])

    %{
      parent_id: goal.id,
      parent_type: :goal,
      parent_name: goal.name,
      headline: buffered_headline(reviewer),
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end

  defp buffered_headline(nil), do: gettext("removed the goal reviewer")
  defp buffered_headline(reviewer), do: gettext("assigned %{reviewer_full_name} as the goal reviewer", reviewer_full_name: reviewer.full_name)

  defp get_reviewer(nil), do: nil
  defp get_reviewer(id), do: Operately.People.get_person!(id)
end
