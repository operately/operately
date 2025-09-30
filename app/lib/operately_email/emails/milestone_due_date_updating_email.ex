defmodule OperatelyEmail.Emails.MilestoneDueDateUpdatingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.Projects.Milestone

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, milestone} = Milestone.get(:system, id: activity.content["milestone_id"], opts: [
      preload: [:project]
    ])
    previous_date = get_date_value(activity.content["old_due_date"])
    new_date = get_date_value(activity.content["new_due_date"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: milestone.project.name, who: author, action: "changed the due date for \"#{milestone.title}\"")
    |> assign(:author, author)
    |> assign(:name, milestone.title)
    |> assign(:previous_date, previous_date)
    |> assign(:new_date, new_date)
    |> assign(:cta_url, Paths.project_path(company, milestone.project) |> Paths.to_url())
    |> render("milestone_due_date_updating")
  end

  defp get_date_value(nil), do: nil
  defp get_date_value(date), do: date.value
end
