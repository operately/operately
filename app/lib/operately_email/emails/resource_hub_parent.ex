defmodule OperatelyEmail.Emails.ResourceHubParent do
  defstruct [:id, :name, :type]

  def fields(resource) do
    parent = from_resource(resource)

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name
    }
  end

  def from_resource(resource) do
    from_hub(resource.resource_hub)
  end

  def from_hub(%{project: project}) when not is_nil(project) do
    %__MODULE__{id: project.id, name: project.name, type: :project}
  end

  def from_hub(%{space: space}) when not is_nil(space) do
    %__MODULE__{id: space.id, name: space.name, type: :space}
  end
end
