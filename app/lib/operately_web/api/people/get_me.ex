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
    conn
    |> me()
    |> preload_manager(inputs[:include_manager])
    |> then(fn me -> %{me: Serializer.serialize(me, level: :full)} end)
    |> ok_tuple()
  end

  defp preload_manager(me, true), do: Repo.preload(me, [:manager])
  defp preload_manager(me, _), do: me

  defp ok_tuple(value) do
    {:ok, value}
  end
end
