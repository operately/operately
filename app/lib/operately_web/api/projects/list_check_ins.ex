defmodule OperatelyWeb.Api.Projects.ListCheckIns do
  @moduledoc """
  Lists all project check-ins for a given project with optional related data.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Access.Binding
  alias Operately.Projects.CheckIn
  alias Operately.Drafts

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

    from(p in CheckIn,
      where: p.project_id == ^id,
      preload: [:acknowledged_by]
    )
    |> include_requested(requested)
    |> filter_visible_check_ins(person.id)
    |> Repo.all()
    |> Enum.sort_by(&Drafts.display_date/1, {:desc, NaiveDateTime})
    |> CheckIn.preload_comment_count()
  end

  defp filter_visible_check_ins(query, person_id) do
    access_level = Binding.view_access()

    from [p] in query,
      join: proj in assoc(p, :project),
      join: c in assoc(proj, :access_context),
      left_join: b in assoc(c, :bindings),
      left_join: g in assoc(b, :group),
      left_join: m in assoc(g, :memberships),
      left_join: person in assoc(m, :person),
      where:
        (p.state == :published and m.person_id == ^person_id and b.access_level >= ^access_level and
           is_nil(person.suspended_at)) or
          (p.state == :draft and p.author_id == ^person_id),
      distinct: true
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
