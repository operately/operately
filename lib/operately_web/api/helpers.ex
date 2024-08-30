defmodule OperatelyWeb.Api.Helpers do
  defmacro __using__(_) do
    quote do
      import OperatelyWeb.Api.Helpers
      import Ecto.Query, only: [from: 2]

      alias Operately.Repo
      alias OperatelyWeb.Api.Serializer

      alias OperatelyWeb.Api.Action
      import OperatelyWeb.Api.Action, only: [run: 3]
    end
  end

  def me(conn) do
    if conn.assigns.current_person do
      conn.assigns.current_person
    else
      raise "No person associated with the connection, maybe you forgot to load the person in a plug?"
    end
  end

  def company(conn) do
    if conn.assigns.current_company do
      conn.assigns.current_company
    else
      raise "No company associated with the connection, maybe you forgot to load the company in a plug?"
    end
  end

  def find_me(conn) do
    if conn.assigns.current_person do
      {:ok, conn.assigns.current_person}
    else
      {:error, :not_found}
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

  def id_without_comments(id) do
    id |> String.split("-") |> List.last()
  end

  @max_comment_length 25

  def id_with_comments(comments, id) when is_binary(comments) do
    comments = comments
      |> String.downcase()
      |> String.replace(~r/[^a-zA-Z0-9]/, "-")
      |> String.trim_leading("-")
      |> String.trim_trailing("-")
      |> String.replace(~r/-+/, "-")

    parts = comments |> String.split("-") |> Enum.reduce("", fn part, acc ->
      cond do
        acc == "" -> part
        String.length(acc) + String.length(part) + 1 > @max_comment_length -> acc
        true -> acc <> "-" <> part
      end
    end)

    parts <> "-" <> id
  end

  def decode_company_id(id) do
    id_without_comments(id)
    |> Operately.Companies.ShortId.decode()
  end

  def decode_id(ids) when is_list(ids) do
    Enum.reduce(ids, {:ok, []}, fn id, {:ok, acc} ->
      case decode_id(id) do
        {:ok, id} -> {:ok, [id | acc]}
        e -> e
      end
    end)
  end

  def decode_id(id) do
    case Ecto.UUID.cast(id) do
      {:ok, id} -> {:ok, id}
      :error -> decode_short_id(id)
    end
  end

  def decode_id(id, :allow_nil) do
    if id == nil do
      {:ok, nil}
    else
      decode_id(id)
    end
  end

  defp decode_short_id(id) do
    id_without_comments(id) |> Operately.ShortUuid.decode()
  end
end
