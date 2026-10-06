defmodule OperatelyEmail.Emails.ProjectDueDateUpdatingEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.Projects.Project

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)
    project = Project.get!(:system, id: activity.content["project_id"])

    previous_date = OperatelyEmail.DateFormatting.format(activity.content["old_due_date"])
    new_date = OperatelyEmail.DateFormatting.format(activity.content["new_due_date"])
    subject_text = subject_text(project.name, author, previous_date, new_date)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(subject_text)
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:previous_date, previous_date)
    |> assign(:new_date, new_date)
    |> assign(:cta_url, Paths.project_path(company, project) |> Paths.to_url())
    |> render("project_due_date_updating")
  end

  defp subject_text(where, author, _old, nil), do: gettext("(%{where}) %{author} removed the due date", where: where, author: Operately.People.Person.short_name(author))
  defp subject_text(where, author, nil, _new), do: gettext("(%{where}) %{author} set the due date", where: where, author: Operately.People.Person.short_name(author))
  defp subject_text(where, author, _old, _new), do: gettext("(%{where}) %{author} changed the due date", where: where, author: Operately.People.Person.short_name(author))

  def buffered_item(_person, activity) do
    project = Operately.Projects.get_project!(activity.content["project_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    old_date = OperatelyEmail.DateFormatting.format(activity.content["old_due_date"])
    new_date = OperatelyEmail.DateFormatting.format(activity.content["new_due_date"])

    %{
      parent_id: project.id,
      parent_type: :project,
      parent_name: project.name,
      headline: buffered_headline(old_date, new_date),
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end

  defp buffered_headline(_old_date, nil), do: gettext("removed the project's due date")
  defp buffered_headline(nil, new_date), do: gettext("set the project's due date to %{date}", date: new_date)
  defp buffered_headline(_old_date, new_date), do: gettext("changed the project's due date to %{date}", date: new_date)
end
