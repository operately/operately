defmodule OperatelyEmail.Emails.GoalEditingEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])

    old_champion = Operately.People.get_person!(activity.content["old_champion_id"])
    new_champion = Operately.People.get_person!(activity.content["new_champion_id"])
    old_reviewer = Operately.People.get_person!(activity.content["old_reviewer_id"])
    new_reviewer = Operately.People.get_person!(activity.content["new_reviewer_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: goal.name, who: author, action: "edited the goal")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:content, activity.content)
    |> assign(:old_champion, old_champion)
    |> assign(:new_champion, new_champion)
    |> assign(:old_reviewer, old_reviewer)
    |> assign(:new_reviewer, new_reviewer)
    |> render("goal_editing")
  end
end
