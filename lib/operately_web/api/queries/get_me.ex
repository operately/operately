defmodule OperatelyWeb.Api.Queries.GetMe do
  use TurboConnect.Query

  alias Operately.Repo

  inputs do
    field :include_manager, :boolean
  end

  outputs do
    field :me, :person
  end

  def call(conn, inputs) do
    conn.assigns.current_account.person
    |> preload_manager(inputs[:include_manager])
    |> serialize(inputs[:include_manager])
    |> ok_tuple()
  end

  defp preload_manager(me, true), do: Repo.preload(me, [:manager])
  defp preload_manager(me, _), do: me

  defp serialize(me, include_manager) do
    %{me: 
      %{
        id: me.id,
        full_name: me.full_name,
        email: me.email,
        timezone: me.timezone,

        send_daily_summary: me.send_daily_summary,
        notify_on_mention: me.notify_on_mention,
        notify_about_assignments: me.notify_about_assignments,

        theme: me.theme || "system",
        manager: include_manager && serialize_manager(me.manager)
      }
    }
  end

  defp serialize_manager(nil), do: nil
  defp serialize_manager(manager) do
    %{
      id: manager.id,
      full_name: manager.full_name,
      email: manager.email,
      avatar_url: manager.avatar_url
    }
  end

  defp ok_tuple(value) do
    {:ok, value}
  end
end
