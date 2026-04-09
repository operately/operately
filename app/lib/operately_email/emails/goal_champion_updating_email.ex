defmodule OperatelyEmail.Emails.GoalChampionUpdatingEmail do
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
    |> subject(where: goal.name, who: author, action: "assigned you as the champion")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:link, OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url())
    |> render("goal_champion_updating")
  end

  def buffered_item(_person, activity) do
    goal = Operately.Goals.get_goal!(activity.content["goal_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    champion = get_champion(activity.content["new_champion_id"])

    %{
      parent_id: goal.id,
      parent_type: :goal,
      parent_name: goal.name,
      headline: buffered_headline(champion),
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end

  defp get_champion(nil), do: nil
  defp get_champion(id), do: Operately.People.Person.get!(:system, id: id)

  defp buffered_headline(nil), do: "removed the goal champion"
  defp buffered_headline(champion), do: "assigned #{champion.full_name} as the goal champion"
end
