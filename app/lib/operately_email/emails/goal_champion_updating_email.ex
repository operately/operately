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
end
