defmodule OperatelyWeb.Api.Queries.GetTask do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Tasks.Task
  alias Operately.Projects.Permissions

  inputs do
    field :id, :id, null: false
    field? :include_assignees, :boolean, null: false
    field? :include_milestone, :boolean, null: false
    field? :include_project, :boolean, null: false
    field? :include_creator, :boolean, null: false
    field? :include_space, :boolean, null: false
    field? :include_permissions, :boolean, null: false
    field? :include_subscription_list, :boolean, null: false
    field? :include_available_statuses, :boolean, null: false
  end

  outputs do
    field? :task, :task, null: true
  end

  def call(conn, inputs) do
    with {:ok, task} <- load(me(conn), inputs),
      {:ok, :allowed} <- Permissions.check(task.request_info.access_level, :can_view) do
        {:ok, %{task: Serializer.serialize(task, level: :full)}}
    else
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, _} -> {:error, :not_found}
    end
  end

  defp load(person, inputs) do
    Task.get(person, id: inputs.id, opts: [
      preload: preload(inputs),
      after_load: after_load(inputs)
    ])
  end

  defp preload(inputs) do
    Inputs.parse_includes(inputs,
      include_assignees: [:assigned_people],
      include_milestone: [milestone: :project],
      include_project: [:project],
      include_creator: [:creator],
      include_space: [:group],
      include_subscription_list: [subscription_list: [subscriptions: :person]]
    )
  end

  defp after_load(inputs) do
    Inputs.parse_includes(inputs,
      include_permissions: &Task.set_permissions/1,
      include_available_statuses: &Task.preload_available_statuses/1
    )
  end
end
