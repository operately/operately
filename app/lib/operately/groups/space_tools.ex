defmodule Operately.Groups.SpaceTools do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false

  embedded_schema do
    field :tasks_enabled, :boolean, default: false
    field :discussions_enabled, :boolean, default: true
    field :resource_hub_enabled, :boolean, default: true

    field :projects, {:array, :map}, virtual: true
    field :goals, {:array, :map}, virtual: true
    field :messages_boards, {:array, :map}, virtual: true
    field :resource_hubs, {:array, :map}, virtual: true
    field :tasks, {:array, :map}, virtual: true
  end

  def changeset(space_tools, attrs) when is_struct(attrs, __MODULE__) do
    changeset(space_tools, Map.from_struct(attrs))
  end

  def changeset(space_tools, attrs) do
    space_tools
    |> cast(attrs, [:tasks_enabled, :discussions_enabled, :resource_hub_enabled])
  end

  def default_settings do
    %__MODULE__{
      tasks_enabled: false,
      discussions_enabled: true,
      resource_hub_enabled: true
    }
  end

  def build_struct(nil, attrs) do
    build_struct(default_settings(), attrs)
  end

  def build_struct(%__MODULE__{} = tools, attrs) do
    %__MODULE__{tools |
      projects: Map.get(attrs, :projects),
      goals: Map.get(attrs, :goals),
      messages_boards: Map.get(attrs, :messages_boards),
      resource_hubs: Map.get(attrs, :resource_hubs),
      tasks: Map.get(attrs, :tasks)
    }
  end
end
