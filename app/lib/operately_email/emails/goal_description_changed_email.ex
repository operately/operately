defmodule OperatelyEmail.Emails.GoalDescriptionChangedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.{Goals, Repo}
  alias OperatelyWeb.Paths

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    goal = Goals.get_goal!(activity.content["goal_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: goal.name, who: author, action: "updated the goal description")
    |> assign(:author, author)
    |> assign(:goal_name, goal.name)
    |> assign(:description, decode_description(activity.content["new_description"]))
    |> assign(:cta_url, Paths.goal_path(company, goal) |> Paths.to_url())
    |> render("goal_description_changed")
  end

  defp decode_description(nil), do: nil

  defp decode_description(description) when is_binary(description) do
    case Jason.decode(description) do
      {:ok, decoded} -> decoded
      _ -> nil
    end
  end

  defp decode_description(description) when is_map(description), do: description
  defp decode_description(_), do: nil
end
