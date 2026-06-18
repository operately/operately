defmodule OperatelyWeb.Api.Serializers.ResourceHubActivity do
  alias OperatelyWeb.Api.Serializer

  def parent_fields(content) do
    %{
      goal: Serializer.serialize(content["goal"], level: :essential),
      project: Serializer.serialize(content["project"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      resource_hub: Serializer.serialize(content["resource_hub"], level: :essential),
    }
  end

  def serialize_resource(content, key, node_key \\ "node") do
    content
    |> then(& &1[key])
    |> attach_node(content[node_key])
    |> Serializer.serialize(level: :essential)
  end

  def attach_node(nil, _node), do: nil
  def attach_node(%Ecto.Association.NotLoaded{}, _node), do: nil
  def attach_node(resource, nil), do: resource
  def attach_node(resource, %Ecto.Association.NotLoaded{}), do: resource
  def attach_node(resource, node), do: Map.put(resource, :node, node)
end
