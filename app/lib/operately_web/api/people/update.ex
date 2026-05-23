defmodule OperatelyWeb.Api.People.Update do
  @moduledoc """
  Updates a person's profile information.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  @notification_preference_fields [:notify_about_assignments, :notify_on_mention, :send_daily_summary, :email_window_minutes, :daily_summary_delivery_time]
  @display_preference_fields [:time_format]
  @updatable_fields_for_oneself [
    :full_name,
    :title,
    :timezone,
    :manager_id,
    :theme,
    :time_format,
    :notify_about_assignments,
    :notify_on_mention,
    :send_daily_summary,
    :email_window_minutes,
    :daily_summary_delivery_time,
    :description
  ]
  @updatable_fields_for_others [:full_name, :title, :timezone, :manager_id]

  inputs do
    field :id, :id, null: false
    field? :full_name, :string, null: false
    field? :title, :string, null: false
    field? :timezone, :string, null: false
    field? :time_format, :time_format, null: false
    field? :manager_id, :id, null: true
    field? :theme, :string, null: false
    field? :notify_about_assignments, :boolean, null: false
    field? :notify_on_mention, :boolean, null: false
    field? :send_daily_summary, :boolean, null: false
    field? :email_window_minutes, :integer, null: false
    field? :daily_summary_delivery_time, :string, null: false
    field? :description, :json, null: true
  end

  outputs do
    field :person, :person, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:person, fn ctx -> Operately.People.get_person_with_access_level(inputs.id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Operately.People.Permissions.check(ctx.person.requester_access_level, :can_edit_profile) end)
    |> run(:updated_person, fn ctx -> update_profile(ctx.person, inputs, ctx.me.id) end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, %{person: Serializer.serialize(ctx.updated_person, level: :essential)}}
      {:error, :me, _} -> {:error, :unauthorized}
      {:error, :inputs, _} -> {:error, :bad_request}
      {:error, :person, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :updated_person, _} -> {:error, :bad_request}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp update_profile(person, inputs, requester_id) do
    inputs =
      if person.id == requester_id do
        Map.take(inputs, @updatable_fields_for_oneself)
        |> normalize_display_preferences()
        |> normalize_notification_preferences()
      else
        Map.take(inputs, @updatable_fields_for_others)
      end

    with {:ok, person} <- Operately.People.update_person(person, inputs) do
      OperatelyWeb.ApiSocket.broadcast!("api:profile_updated:#{person.id}")
      {:ok, person}
    end
  end

  defp normalize_notification_preferences(inputs) do
    notifications = Map.take(inputs, @notification_preference_fields)

    if map_size(notifications) == 0 do
      inputs
    else
      inputs
      |> Map.drop(@notification_preference_fields)
      |> put_preference(:notifications, notifications)
    end
  end

  defp normalize_display_preferences(inputs) do
    display_preferences = Map.take(inputs, @display_preference_fields)

    if map_size(display_preferences) == 0 do
      inputs
    else
      inputs
      |> Map.drop(@display_preference_fields)
      |> put_preferences(display_preferences)
    end
  end

  defp put_preferences(inputs, preferences) do
    Map.update(inputs, :preferences, preferences, &Map.merge(&1, preferences))
  end

  defp put_preference(inputs, key, value) do
    put_preferences(inputs, %{key => value})
  end
end
