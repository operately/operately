defmodule Operately.WorkMaps.WorkMapMilestone do
  @moduledoc """
  Minimal milestone data required by the Work Map API.
  """

  alias Operately.Projects.Milestone

  @enforce_keys [:id, :title, :status, :timeframe]
  defstruct [:id, :title, :status, :timeframe]

  def from_milestone(%Milestone{} = milestone) do
    %__MODULE__{
      id: milestone.id,
      title: milestone.title,
      status: milestone.status,
      timeframe: milestone.timeframe
    }
  end
end
