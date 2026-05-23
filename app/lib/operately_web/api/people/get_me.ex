defmodule OperatelyWeb.Api.People.GetMe do
  @moduledoc """
  Retrieves the current user's profile information.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Repo

  inputs do
    field? :include_manager, :boolean, null: false
  end

  outputs do
    field :me, :person, null: false
  end

  def call(conn, inputs) do
    me(conn)
    |> preload_manager(inputs[:include_manager])
    |> serialize(inputs[:include_manager])
    |> ok_tuple()
  end

  defp preload_manager(me, true), do: Repo.preload(me, [:manager])
  defp preload_manager(me, _), do: me

  defp serialize(me, include_manager) do
    %{
      me: %{
        id: OperatelyWeb.Paths.person_id(me),
        full_name: me.full_name,
        email: me.email,
        type: Atom.to_string(me.type),
        title: me.title,
        avatar_url: me.avatar_url,
        timezone: me.timezone,
        time_format: me |> Operately.People.Person.time_format() |> Atom.to_string(),
        avatar_blob_id: me.avatar_blob_id,
        email_preference: me |> Operately.People.Person.email_preference() |> Atom.to_string(),
        email_window_minutes: Operately.People.Person.email_window_minutes(me),
        send_daily_summary: Operately.People.Person.send_daily_summary?(me),
        daily_summary_delivery_time: Operately.People.Person.daily_summary_delivery_time(me),
        notify_on_mention: Operately.People.Person.notify_on_mention?(me),
        notify_about_assignments: Operately.People.Person.notify_about_assignments?(me),
        description: encode_description(me.description),
        manager: include_manager && serialize_manager(me.manager),
        show_dev_bar: Application.get_env(:operately, :app_env) == :dev
      }
    }
  end

  defp serialize_manager(nil), do: nil

  defp serialize_manager(manager) do
    %{
      id: OperatelyWeb.Paths.person_id(manager),
      full_name: manager.full_name,
      email: manager.email,
      type: Atom.to_string(manager.type),
      title: manager.title,
      avatar_url: manager.avatar_url
    }
  end

  defp encode_description(nil), do: nil
  defp encode_description(description), do: Jason.encode!(description)

  defp ok_tuple(value) do
    {:ok, value}
  end
end
