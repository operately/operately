defmodule OperatelyWeb.Api.Projects.ListCheckIns do
  @moduledoc """
  Lists all project check-ins for a given project with optional related data.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters

  alias Operately.Projects.CheckIn

  inputs do
    field :project_id, :id
    field? :include_author, :boolean
    field? :include_project, :boolean
    field? :include_reactions, :boolean
  end

  outputs do
    field :project_check_ins, list_of(:project_check_in), null: false
  end

  def call(conn, inputs) do
    project_check_ins = load(me(conn), inputs.project_id, inputs)
    {:ok, %{project_check_ins: Serializer.serialize(project_check_ins, level: :essential)}}
  end

  defp load(person, id, inputs) do
    requested = extract_include_filters(inputs)

    published =
      from p in CheckIn,
        where: p.project_id == ^id,
        where: p.state == :published,
        preload: [:acknowledged_by],
        order_by: [desc: p.inserted_at]

    drafts =
      from p in CheckIn,
        where: p.project_id == ^id,
        where: p.state == :draft and p.author_id == ^person.id,
        preload: [:acknowledged_by],
        order_by: [desc: p.inserted_at]

    published =
      published
      |> include_requested(requested)
      |> filter_by_view_access(person.id, join_parent: :project)
      |> Repo.all()

    drafts =
      drafts
      |> include_requested(requested)
      # Drafts are private to the author and stay recoverable even when normal history access hides published check-ins.
      |> Repo.all()

    (published ++ drafts)
    |> Enum.sort_by(& &1.inserted_at, {:desc, NaiveDateTime})
    |> CheckIn.preload_comment_count()
  end

  def include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_author -> from p in q, preload: [:author]
        :include_project -> from p in q, preload: [:project]
        :include_reactions -> from p in q, preload: [reactions: :person]
        _ -> raise ArgumentError, "Unknown include filter: #{inspect(include)}"
      end
    end)
  end
end
