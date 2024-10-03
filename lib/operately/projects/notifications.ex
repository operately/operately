defmodule Operately.Projects.Notifications do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Notifications.SubscribersLoader

  def get_check_in_subscribers(check_in_id, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])

    check_in =
      from(c in Operately.Projects.CheckIn, where: c.id == ^check_in_id)
      |> preload_project_resources()
      |> Repo.one()

    people = Enum.map(check_in.project.contributors, &(&1.person))

    SubscribersLoader.load_for_notifications(check_in, people, ignore)
  end

  def get_retrospective_subscribers(retrospective_id, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])

    retrospective =
      from(r in Operately.Projects.Retrospective, where: r.id == ^retrospective_id)
      |> preload_project_resources()
      |> Repo.one()

    people = Enum.map(retrospective.project.contributors, &(&1.person))

    SubscribersLoader.load_for_notifications(retrospective, people, ignore)
  end

  #
  # Helpers
  #

  defp preload_project_resources(query) do
    from(resource in query,
      join: project in assoc(resource, :project),
      join: context in assoc(project, :access_context),
      join: contribs in assoc(project, :contributors),
      join: person in assoc(contribs, :person),
      preload: [project: {project, [contributors: {contribs, person: person}]}, access_context: context]
    )
  end
end
