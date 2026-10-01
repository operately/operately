defmodule OperatelyEmail.Emails.ProjectCheckInSubmittedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects}
  alias OperatelyWeb.Paths
  alias OperatelyEmail.CheckInOverview

  def send(person, activity) do
    author = Repo.preload(activity, :author).author

    project = Projects.get_project!(activity.content["project_id"])
    project = Repo.preload(project, [:company, :reviewer, :champion])

    check_in = Projects.get_check_in!(activity.content["check_in_id"])
    company = project.company

    {cta_text, cta_url} = construct_cta_text_and_url(person, company, project, check_in)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(gettext("(%{project_name}) %{author} submitted a check-in", project_name: project.name, author: Operately.People.Person.short_name(author)))
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:check_in, check_in)
    |> assign(:cta_url, cta_url)
    |> assign(:cta_text, cta_text)
    |> assign(:overview, CheckInOverview.construct(:project, check_in.status, project.reviewer, Operately.ContextualDates.Timeframe.end_date(project.timeframe)))
    |> render("project_check_in_submitted")
  end

  defp construct_cta_text_and_url(person, company, project, check_in) do
    url = Paths.project_check_in_path(company, check_in) |> Paths.to_url()

    OperatelyEmail.AcknowledgeCta.build(
      person,
      check_in.author_id,
      [project.reviewer, project.champion],
      url,
      gettext("View Check-In")
    )
  end

  def buffered_item(_person, activity) do
    project = Operately.Projects.get_project!(activity.content["project_id"])
    check_in = Operately.Projects.get_check_in!(activity.content["check_in_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(check_in.description)

    %{
      parent_id: project.id,
      parent_type: :project,
      parent_name: project.name,
      parent_url: OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url(),
      headline: "submitted a check-in with status \"#{status_label(check_in.status)}\"",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.project_check_in_path(company, check_in) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end

  defp status_label(:on_track), do: "on track"
  defp status_label(:off_track), do: "off track"
  defp status_label(status) when is_binary(status), do: status
  defp status_label(status) when is_atom(status), do: Atom.to_string(status)
end
