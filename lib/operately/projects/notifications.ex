defmodule Operately.Projects.Notifications do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Notifications.SubscribersLoader

  def get_check_in_subscribers(check_in_id, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])

    check_in =
      from(c in Operately.Projects.CheckIn,
        join: project in assoc(c, :project),
        join: context in assoc(project, :access_context),
        join: contribs in assoc(project, :contributors),
        join: person in assoc(contribs, :person),
        preload: [project: {project, [contributors: {contribs, person: person}]}, access_context: context],
        where: c.id == ^check_in_id
      )
      |> Repo.one()

    people = Enum.map(check_in.project.contributors, &(&1.person))

    SubscribersLoader.load_for_notifications(check_in, people, ignore)
  end
end
