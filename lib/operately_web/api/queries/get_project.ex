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
    field :include_champion, :boolean
    field :include_reviewer, :boolean
    field :include_space, :boolean
    field :include_contributors_access_levels, :boolean
    field :include_access_levels, :boolean
    field :include_privacy, :boolean
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    with :ok <- check_inputs(inputs),
         {:ok, id} <- decode_id(inputs[:id]),
         {:ok, project} <- load(me(conn), id, inputs) do
      {:ok, %{project: Serializer.serialize(project, level: :full)}}
    end
  end

  def load(requester, id, inputs) do
    Project.get(requester, id: id, opts: [
      with_deleted: true,
      preload: preload(inputs),
      after_load: [
        set_permissions_if_requested(inputs),
        load_contributors_access_levels_if_requested(inputs),
        load_general_access_levels_if_requested(inputs),
      ],
    ])
  end

  def preload(inputs) do
    OperatelyWeb.Api.Helpers.Inputs.parse_includes(inputs, [
      include_closed_by: [:closed_by],
      include_contributors: [contributors: [:person]],
      include_key_resources: [key_resources: :project],
      include_milestones: [:milestones],
      include_goal: [:goal],
      include_space: [:group],
      include_champion: [:champion],
      include_reviewer: [:reviewer],
    ])
  end

  def set_permissions_if_requested(inputs) do
    if inputs[:include_permissions] do
      &Project.set_permissions/1
    else
      do_nothing()
    end
  end

  def load_contributors_access_levels_if_requested(inputs) do
    if inputs[:include_contributors_access_levels] do
      &Project.load_contributor_access_levels/1
    else
      do_nothing()
    end
  end

  def load_general_access_levels_if_requested(inputs) do
    if inputs[:include_access_levels] do
      &Project.load_access_levels/1
    else
      do_nothing()
    end
  end

  def do_nothing(), do: fn project -> project end

  defp check_inputs(inputs) do
    cond do
      inputs[:id] == nil -> 
        {:error, :bad_request, "id is required"}

      inputs[:include_contributors_access_levels] ->
        if inputs[:include_contributors] do
          :ok
        else
          {:error, :bad_request, "include_contributors_access_levels requires include_contributors"}
        end

      true -> 
        :ok
    end
  end
end
