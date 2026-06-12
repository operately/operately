defmodule OperatelyWeb.Api.Serializers.ResourceHubActivity do
  alias OperatelyWeb.Api.Serializer

  def parent_fields(content) do
    %{
      project: Serializer.serialize(content["project"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      resource_hub: Serializer.serialize(content["resource_hub"], level: :essential),
    }
  end

  def serialize_resource(content, key, node_key \\ "node") do
    content
    |> Map.get(key)
    |> attach_node(Map.get(content, node_key))
    |> Serializer.serialize(level: :essential)
  end

  def attach_node(nil, _node), do: nil
  def attach_node(%Ecto.Association.NotLoaded{}, _node), do: nil
  def attach_node(resource, nil), do: resource
  def attach_node(resource, %Ecto.Association.NotLoaded{}), do: resource
  def attach_node(resource, node), do: Map.put(resource, :node, node)
end
