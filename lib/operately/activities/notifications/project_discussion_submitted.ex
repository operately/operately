defmodule Operately.Activities.Notifications.ProjectDiscussionSubmitted do
  import Ecto.Query

  alias Operately.Repo
  alias Operately.People.Person
  alias Operately.Projects.Contributor

  def dispatch(activity) do
    author_id = activity.author_id
    project_id = activity.content["project_id"]
    contributors = list_contributors(project_id, exclude: author_id)

    notifications = Enum.map(contributors, fn person ->
      %{
        person_id: person.id,
        activity_id: activity.id,
        should_send_email: true,
      }
    end)

    Operately.Notifications.bulk_create(notifications)
  end

  def list_contributors(project_id, exclude: author_id) do
    query = from p in Person,
      join: c in Contributor, on: c.person_id == p.id, 
      where: c.project_id == ^project_id,
      where: p.id != ^author_id,
      where: not is_nil(p.email) and p.notify_about_assignments

    Repo.all(query)
  end
end
