defmodule OperatelyWeb.Api.Queries.GetProject do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.Project
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :id, :string

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
    field :include_retrospective, :boolean
    field :include_potential_subscribers, :boolean
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
      after_load: after_load(inputs),
    ])
  end

  def preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_contributors: [contributors: [:person]],
      include_key_resources: [key_resources: :project],
      include_milestones: [milestones: :project],
      include_goal: [:goal],
      include_space: [:group],
      include_champion: [:champion],
      include_reviewer: [:reviewer],
      include_last_check_in: [last_check_in: :author],
      include_retrospective: [:retrospective],
      include_potential_subscribers: [contributors: :person],
    ])
  end

  def after_load(inputs) do
    Inputs.parse_includes(inputs, [
      include_permissions: &Project.set_permissions/1,
      include_contributors_access_levels: &Project.load_contributor_access_levels/1,
      include_access_levels: &Project.load_access_levels/1,
      include_privacy: &Project.load_privacy/1,
      include_potential_subscribers: &Project.set_potential_subscribers/1,
    ])
  end

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
