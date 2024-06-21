defmodule OperatelyWeb.Api.Queries.GetProject do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.Project
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :id, :string

    field :include_closed_by, :boolean
    field :include_contributors, :boolean
    field :include_goal, :boolean
    field :include_key_resources, :boolean
    field :include_last_check_in, :boolean
    field :include_milestones, :boolean
    field :include_permissions, :boolean
    field :include_retrospective, :boolean
    field :include_champion, :boolean
    field :include_reviewer, :boolean
    field :include_space, :boolean
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    if inputs[:id] == nil do
      {:error, :bad_request}
    else
      include_filters = extract_include_filters(inputs)
      project = load(me(conn), inputs[:id], include_filters)

      if nil == project do
        {:error, :not_found}
      else
        {:ok, %{project: Serializer.serialize(project, level: :full)}}
      end
    end
  end

  def load(person, id, include_filters) do
    query = from p in Project, as: :project, where: p.id == ^id

    query
    |> Project.scope_company(person.company_id)
    |> Project.scope_visibility(person.id)
    |> include_requested(include_filters)
    |> Repo.one()
    |> Project.after_load_hooks()
  end

  def include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_closed_by -> from p in q, preload: [:closed_by]
        :include_contributors -> from p in q, preload: [contributors: :person]
        :include_key_resources -> from p in q, preload: [:key_resources]
        :include_last_check_in -> from p in q, preload: [last_check_in: :author]
        :include_milestones -> from p in q, preload: [:milestones]
        :include_goal -> from p in q, preload: [:goal]
        :include_space -> from p in q, preload: [:space]
        :include_champion -> from p in q, preload: [:champion]
        :include_reviewer -> from p in q, preload: [:reviewer]
        :include_archived -> from p in q, where: is_nil(p.deleted_at)
        _ -> raise ArgumentError, "Unknown include filter: #{inspect(include)}"
      end
    end)
  end
end
