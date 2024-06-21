defmodule OperatelyWeb.Api.Queries.GetProject do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.Project

  inputs do
    field :id, :string

    field :include_goal, :boolean
    field :include_reviewer, :boolean
    field :include_contributors, :boolean
    field :include_permissions, :boolean
    field :include_space, :boolean
    field :include_key_resources, :boolean
    field :include_milestones, :boolean
    field :include_last_check_in, :boolean
    field :include_retrospective, :boolean
    field :include_closed_by, :boolean
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    query = from p in Project, as: :project, where: p.id == ^inputs.id

    query
    |> Project.scope_company(me(conn).company_id)
    |> Project.scope_visibility(me(conn).id)
    |> extend_query(inputs[:space_id], fn q -> from p in q, where: p.group_id == ^inputs.space_id end)
    |> extend_query(inputs[:goal_id], fn q -> from p in q, where: p.goal_id == ^inputs.goal_id end)
    |> extend_query(inputs[:include_space], fn q -> from p in q, preload: [:group] end)
    |> extend_query(inputs[:include_contributors], fn q -> from p in q, preload: [contributors: :person] end)
    |> extend_query(inputs[:include_last_check_in], fn q -> from p in q, preload: [last_check_in: :author] end)
    |> extend_query(inputs[:include_champion], fn q -> from p in q, preload: [:champion] end)
    |> extend_query(inputs[:include_goal], fn q -> from p in q, preload: [:goal] end)
    |> extend_query(inputs[:include_archived], fn q -> from p in q, where: is_nil(p.deleted_at) end)
    |> extend_query(inputs[:include_milestones], fn q -> from p in q, preload: [:milestones] end)
    |> Repo.all()
    |> Project.after_load_hooks()
  end
end
