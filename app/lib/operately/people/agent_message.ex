defmodule Operately.People.AgentMessage do
  use Operately.Schema
  import Ecto.Changeset

  schema "agent_messages" do
    belongs_to :convo, Operately.People.AgentConvo

    field :source, Ecto.Enum, values: [:user, :ai], default: :user
    field :status, Ecto.Enum, values: [:pending, :done], default: :pending
    field :message, :string
    field :prompt, :string

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(agent_message, attrs) do
    agent_message
    |> cast(attrs, [:status, :convo_id, :source, :message, :prompt])
    |> validate_required([:status, :convo_id, :source])
  end
end
