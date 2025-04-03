defmodule Operately.Groups.SpaceTools do
  defstruct [
    :projects,
    :goals,
    :messages_boards,
    :resource_hubs,
  ]

  def build_struct(attrs) do
    %__MODULE__{
      projects: attrs.projects,
      goals: attrs.goals,
      messages_boards: attrs.messages_boards,
      resource_hubs: attrs.resource_hubs,
    }
  end
end
