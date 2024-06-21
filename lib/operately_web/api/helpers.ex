defmodule OperatelyWeb.Api.Helpers do
  defmacro __using__(_) do
    quote do
      import OperatelyWeb.Api.Helpers
      import Ecto.Query, only: [from: 2]

      alias Operately.Repo
    end
  end

  def me(conn) do
    if conn.assigns.current_account do
      conn.assigns.current_account.person
    else
      raise "No account associated with the connection, maybe you forgot to load the account in a plug?"
    end
  end

  def extend_query(query, nil, _), do: query
  def extend_query(query, false, _), do: query
  def extend_query(query, _, fun), do: fun.(query)

  def extend_map_if(m1, true, fun), do: Map.merge(m1, fun.())
  def extend_map_if(m1, _, _), do: m1

  def extract_include_filters(inputs) do
    Enum.reduce(inputs, [], fn {k, v}, acc ->
      if String.starts_with?(Atom.to_string(k), "include_") && v do
        [k | acc]
      else
        acc
      end
    end)
  end
end
