defmodule Operately.People.AgentMessage do
  use Operately.Schema
  import Ecto.Changeset

  schema "agent_messages" do
    belongs_to :convo, Operately.People.AgentConvo

    field :status, Ecto.Enum, values: [:pending, :done], default: :pending
    field :message, :string

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(agent_message, attrs) do
    agent_message
    |> cast(attrs, [:status, :message, :convo_id])
    |> validate_required([:status, :message, :convo_id])
  end
end
