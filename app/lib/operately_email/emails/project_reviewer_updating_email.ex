defmodule OperatelyEmail.Emails.ProjectReviewerUpdatingEmail do
  use Gettext, backend: OperatelyWeb.Gettext
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
    |> subject(subject_text(project.name, author, person, reviewer))
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:reviewer, reviewer)
    |> assign(:person, person)
    |> assign(:cta_url, Paths.project_path(company, project) |> Paths.to_url())
    |> render("project_reviewer_updating")
  end

  defp get_reviewer(nil), do: nil
  defp get_reviewer(id), do: Person.get!(:system, id: id)

  defp subject_text(where, author, _person, nil), do: gettext("(%{where}) %{author} removed the reviewer", where: where, author: Operately.People.Person.short_name(author))
  defp subject_text(where, author, person, reviewer) do
    if person.id == reviewer.id do
      gettext("(%{where}) %{author} assigned you as the reviewer", where: where, author: Operately.People.Person.short_name(author))
    else
      gettext("(%{where}) %{author} assigned %{reviewer} as the reviewer", where: where, author: Operately.People.Person.short_name(author), reviewer: Person.short_name(reviewer))
    end
  end

  def buffered_item(_person, activity) do
    project = Operately.Projects.get_project!(activity.content["project_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    reviewer = get_reviewer(activity.content["new_reviewer_id"])

    %{
      parent_id: project.id,
      parent_type: :project,
      parent_name: project.name,
      headline: buffered_headline(reviewer),
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end

  defp buffered_headline(nil), do: "removed the project reviewer"
  defp buffered_headline(reviewer), do: "assigned #{reviewer.full_name} as the project reviewer"
end
