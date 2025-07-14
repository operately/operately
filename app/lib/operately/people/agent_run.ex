defmodule Operately.People.AgentRun do
  use Operately.Schema
  import Ecto.Changeset

  alias Operately.Repo
  alias Ecto.Multi

  schema "agent_runs" do
    field :status, Ecto.Enum, values: [:planning, :running, :completed, :failed, :cancelled]
    field :started_at, :utc_datetime_usec
    field :finished_at, :utc_datetime_usec
    field :error_message, :string
    field :logs, :string
    field :sandbox_mode, :boolean, default: false

    belongs_to :agent_def, Operately.People.AgentDef

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(agent_run, attrs) do
    agent_run
    |> cast(attrs, [:agent_def_id, :status, :started_at, :finished_at, :error_message, :logs, :sandbox_mode])
    |> validate_required([:agent_def_id, :status, :started_at])
    |> validate_inclusion(:status, [:planning, :running, :completed, :failed, :cancelled])
    |> assoc_constraint(:agent_def)
  end

  def create(agent_def, dispatch \\ true) do
    run =
      changeset(%{
        agent_def_id: agent_def.id,
        sandbox_mode: agent_def.sandbox_mode,
        status: :planning,
        started_at: DateTime.utc_now()
      })

    Multi.new()
    |> Multi.insert(:agent_run, run)
    |> Multi.run(:worker, fn _repo, %{agent_run: agent_run} ->
      if dispatch do
        Operately.Ai.AgentWorker.new(%{agent_run_id: agent_run.id}) |> Oban.insert()
      else
        {:ok, nil}
      end
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{agent_run: agent_run}} -> {:ok, agent_run}
      {:error, :agent_run, changeset, _} -> {:error, changeset}
      {:error, :worker, error, _} -> {:error, error}
    end
  end

  def append_log(agent_run_id, msg) do
    alias Ecto.Adapters.SQL
    alias Operately.Repo

    SQL.query(Repo, "UPDATE agent_runs SET logs = COALESCE(logs, '') || $1 WHERE id = $2", [msg, Ecto.UUID.dump!(agent_run_id)])
  end
end
