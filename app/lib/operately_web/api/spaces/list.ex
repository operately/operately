defmodule OperatelyWeb.Api.Spaces.List do
  @moduledoc """
  Lists all spaces accessible to the current user.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups.Group

  inputs do
    field? :access_level, :access_options, null: false

    field? :include_permissions, :boolean, null: false
    field? :include_access_levels, :boolean, null: false
    field? :include_members, :boolean, null: false
  end

  outputs do
    field :spaces, list_of(:space), null: false
  end

  def call(conn, inputs) do
    spaces = load_spaces(me(conn), inputs, company_read_only(conn))

    {:ok, %{spaces: Serializer.serialize(spaces, level: :full)}}
  end

  defp load_spaces(me, inputs, company_read_only) do
    search_spaces(me, inputs)
    |> Repo.preload([:company, :members])
    |> load_permissions(inputs[:include_permissions], company_read_only)
    |> load_access_levels(inputs[:include_access_levels])
  end

  defp search_spaces(me, %{include_permissions: true} = inputs) do
    Group.search_with_request_info(me, "", inputs[:access_level])
  end

  defp search_spaces(me, inputs), do: Group.search(me, "", inputs[:access_level])

  defp load_permissions(spaces, true, company_read_only) do
    Enum.map(spaces, &Group.preload_permissions(&1, company_read_only))
  end

  defp load_permissions(spaces, _, _company_read_only), do: spaces

  defp load_access_levels(spaces, true) do
    Enum.map(spaces, &Operately.Groups.Group.preload_access_levels/1)
  end

  defp load_access_levels(spaces, _), do: spaces
end
