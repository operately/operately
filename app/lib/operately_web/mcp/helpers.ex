defmodule OperatelyWeb.Mcp.Helpers do
  alias OperatelyWeb.Api.Comments.List, as: CommentsList
  alias OperatelyWeb.Api.Helpers, as: ApiHelpers

  def decode_id(id) when is_binary(id) do
    case ApiHelpers.decode_id(id) do
      {:ok, decoded_id} -> {:ok, decoded_id}
      {:error, _reason} -> {:error, :invalid_arguments}
    end
  end

  def decode_optional_id(nil), do: {:ok, nil}
  def decode_optional_id(id), do: decode_id(id)

  def put_optional(map, _key, nil), do: map
  def put_optional(map, key, value), do: Map.put(map, key, value)

  def load_comments(conn, entity_id, entity_type) do
    case CommentsList.call(conn, %{entity_id: entity_id, entity_type: entity_type}) do
      {:ok, %{comments: comments}} -> comments
      _unexpected -> []
    end
  end
end
