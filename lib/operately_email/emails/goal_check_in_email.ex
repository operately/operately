defmodule OperatelyEmail.Emails.GoalCheckInEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}
  alias Operately.Goals.Update
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])

    {:ok, update} = Update.get(:system, id: activity.content["update_id"])
    {cta_text, cta_url} = contruct_cta_text_and_url(person, company, goal, update)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: goal.name, who: author, action: "submitted a check-in")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:update, update)
    |> assign(:cta_url, cta_url)
    |> assign(:cta_text, cta_text)
    |> render("goal_check_in")
  end

  defp contruct_cta_text_and_url(person, company, goal, check_in) do
    url = Paths.goal_check_in_path(company, check_in) |> Paths.to_url()

    if goal.reviewer_id == person.id do
      {"Acknowledge", url <> "?acknowledge=true"}
    else
      {"View Check-In", url}
    end
  end
end
