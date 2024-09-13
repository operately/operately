defmodule OperatelyWeb.Api.Queries.GetProjectCheckIn do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters

  alias Operately.Projects.{CheckIn, Project}
  alias Operately.Notifications.Subscription

  inputs do
    field :id, :string
    field :include_author, :boolean
    field :include_project, :boolean
    field :include_reactions, :boolean
    field :include_subscriptions, :boolean
  end

  outputs do
    field :project_check_in, :project_check_in
  end

  def call(conn, inputs) do
    case decode_id(inputs[:id]) do
      {:ok, id} ->
        project_check_in = load(me(conn), id, inputs)

        if nil == project_check_in do
          {:error, :not_found}
        else
          {:ok, %{project_check_in: Serializer.serialize(project_check_in, level: :full)}}
        end
      {:error, _} -> {:error, :bad_request}
    end
  end

  defp load(person, id, inputs) do
    requested = extract_include_filters(inputs)

    query = from p in CheckIn,
      where: p.id == ^id,
      preload: [:acknowledged_by]

    query
    |> include_requested(requested)
    |> filter_by_view_access(person.id, join_parent: :project)
    |> Repo.one()
    |> load_project(inputs, person)
  end

  def include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_author -> from p in q, preload: [:author]
        :include_reactions -> from p in q, preload: [reactions: :person]
        :include_subscriptions -> Subscription.preload_subscriptions(q)
        _ -> q
      end
    end)
  end

  def load_project(check_in, inputs, person) do
    if inputs[:include_project] do
      {:ok, project} = Operately.Projects.Project.get(person, id: check_in.project_id, opts: [
        with_deleted: true, 
        preload: [:reviewer, [contributors: :person]],
        after_load: [&Project.set_permissions/1]
      ])

      %{check_in | project: project}
    else
      check_in
    end
  end

end
