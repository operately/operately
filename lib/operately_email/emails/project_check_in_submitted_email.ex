defmodule OperatelyEmail.Emails.ProjectCheckInSubmittedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects}
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    project = Projects.get_project!(activity.content["project_id"])
    check_in = Projects.get_check_in!(activity.content["check_in_id"])
    company = Operately.Repo.preload(project, :company).company

    {cta_text, cta_url} = contruct_cta_text_and_url(person, company, project, check_in)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "submitted a check-in")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:check_in, check_in)
    |> assign(:cta_url, cta_url)
    |> assign(:cta_text, cta_text)
    |> render("project_check_in_submitted")
  end


  defp contruct_cta_text_and_url(person, company, project, check_in) do
    reviewer = Projects.get_person_by_role(project, :reviewer)
    url = Paths.project_check_in_path(company, project, check_in) |> Paths.to_url()

    if person.id == reviewer.id do
      {"Acknowledge", url <> "?acknowledge=true"}
    else
      {"View Check-In", url}
    end
  end
end
