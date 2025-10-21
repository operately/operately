defmodule OperatelyEmail.Emails.ProjectMilestoneCreationEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.Projects.Milestone
  alias Operately.ContextualDates.ContextualDate
  alias OperatelyWeb.Paths

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, milestone} = Milestone.get(:system, id: activity.content["milestone_id"], opts: [preload: [:project]])
    project = milestone.project
    due_date = milestone_due_date(milestone)
    link = Paths.project_milestone_path(company, milestone) |> Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "created the \"#{milestone.title}\" milestone")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:milestone, milestone)
    |> assign(:due_date, due_date)
    |> assign(:cta_url, link)
    |> render("project_milestone_creation")
  end

  defp milestone_due_date(%{timeframe: nil}), do: nil

  defp milestone_due_date(%{timeframe: timeframe}) do
    case Map.get(timeframe, :contextual_end_date) || Map.get(timeframe, "contextual_end_date") do
      nil -> nil
      %ContextualDate{value: value} -> value
      %{value: value} -> value
      %{"value" => value} -> value
      _ -> nil
    end
  end
end
