defmodule Operately.People.AgentRun do
  use Operately.Schema
  import Ecto.Changeset

  alias Operately.Repo
  alias Ecto.Multi

  schema "agent_runs" do
    field :status, Ecto.Enum, values: [:pending, :running, :completed, :failed, :cancelled]
    field :started_at, :utc_datetime_usec
    field :finished_at, :utc_datetime_usec
    field :error_message, :string
    field :logs, :string

    belongs_to :agent_def, Operately.People.AgentDef

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(agent_run, attrs) do
    agent_run
    |> cast(attrs, [:agent_def_id, :status, :started_at, :finished_at, :error_message, :logs])
    |> validate_required([:agent_def_id, :status, :started_at])
    |> validate_inclusion(:status, [:pending, :running, :completed, :failed, :cancelled])
    |> assoc_constraint(:agent_def)
  end

  def create(agent_def_id) do
    run =
      changeset(%{
        agent_def_id: agent_def_id,
        status: :pending,
        started_at: DateTime.utc_now()
      })

    Multi.new()
    |> Multi.insert(:agent_run, run)
    |> Multi.run(:worker, fn _repo, %{agent_run: agent_run} ->
      Operately.Ai.AgentWorker.new(%{agent_run_id: agent_run.id}) |> Oban.insert()
    end)
    |> Repo.transaction()
  end
end
