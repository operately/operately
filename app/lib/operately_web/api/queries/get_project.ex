defmodule OperatelyWeb.Api.Queries.GetProject do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.Project
  alias OperatelyWeb.Api.Serializer
  alias Operately.Notifications.UnreadNotificationsLoader

  inputs do
    field? :id, :string, null: true

    field? :include_contributors, :boolean, null: true
    field? :include_goal, :boolean, null: true
    field? :include_key_resources, :boolean, null: true
    field? :include_last_check_in, :boolean, null: true
    field? :include_milestones, :boolean, null: true
    field? :include_permissions, :boolean, null: true
    field? :include_champion, :boolean, null: true
    field? :include_reviewer, :boolean, null: true
    field? :include_space, :boolean, null: true
    field? :include_contributors_access_levels, :boolean, null: true
    field? :include_access_levels, :boolean, null: true
    field? :include_privacy, :boolean, null: true
    field? :include_retrospective, :boolean, null: true
    field? :include_potential_subscribers, :boolean, null: true
    field? :include_unread_notifications, :boolean, null: true
    field? :include_subscription_list, :boolean, null: true

    field? :include_markdown, :boolean
  end

  outputs do
    field?(:project, :project)
    field?(:markdown, :string)
  end

  def call(conn, inputs) do
    with :ok <- check_inputs(inputs),
         {:ok, id} <- decode_id(inputs[:id]),
         {:ok, project} <- load(me(conn), id, inputs) do
      serialize(project, inputs[:include_markdown])
    end
  end

  defp serialize(project, include_md) do
    json = Serializer.serialize(project, level: :full)

    if include_md do
      markdown = Operately.MD.Project.render(project)

      {:ok, %{project: json, markdown: markdown}}
    else
      {:ok, %{project: json}}
    end
  end

  def load(requester, id, inputs) do
    Project.get(requester,
      id: id,
      opts: [
        with_deleted: true,
        preload: preload(inputs),
        after_load: after_load(inputs, requester)
      ]
    )
  end

  def preload(inputs) do
    Inputs.parse_includes(inputs,
      include_contributors: [contributors: [:person]],
      include_key_resources: [key_resources: :project],
      include_goal: [:goal],
      include_space: [:group],
      include_champion: [:champion],
      include_reviewer: [:reviewer],
      include_last_check_in: [last_check_in: :author],
      include_retrospective: [:retrospective],
      include_subscription_list: [subscription_list: [subscriptions: :person]]
    )
  end

  def after_load(inputs, person) do
    Inputs.parse_includes(inputs,
      include_milestones: &Project.load_milestones/1,
      include_permissions: &Project.set_permissions/1,
      include_contributors_access_levels: &Project.load_contributor_access_levels/1,
      include_access_levels: &Project.load_access_levels/1,
      include_privacy: &Project.load_privacy/1,
      include_potential_subscribers: &Project.load_potential_subscribers/1,
      include_unread_notifications: UnreadNotificationsLoader.load(person)
    )
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
