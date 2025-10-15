defmodule OperatelyEmail.Emails.ProjectReviewerUpdatingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.Projects
  alias Operately.People.Person
  alias OperatelyWeb.Paths

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)
    project = Projects.get_project!(activity.content["project_id"])
    reviewer = get_reviewer(activity.content["new_reviewer_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: get_action(person, reviewer))
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:reviewer, reviewer)
    |> assign(:cta_url, Paths.project_path(company, project) |> Paths.to_url())
    |> render("project_reviewer_updating")
  end

  defp get_reviewer(nil), do: nil
  defp get_reviewer(id), do: Person.get!(:system, id: id)

  defp get_action(_person, nil), do: "removed the reviewer"
  defp get_action(person, reviewer) do
    if person.id == reviewer.id do
      "assigned you as the reviewer"
    else
      "assigned #{Person.short_name(reviewer)} as the reviewer"
    end
  end
end
