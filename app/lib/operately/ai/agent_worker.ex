defmodule Operately.Ai.AgentWorker do
  require Logger
  use Oban.Worker

  alias Operately.Repo
  alias Operately.People.AgentRun
  import Ecto.Query

  #
  # Performs the agent run execution, from fetching the agent run
  # to marking it as completed or failed.
  #
  def perform(job) do
    agent_run_id = job.args["agent_run_id"]

    with {:ok, agent_run} <- get_agent_run(agent_run_id),
         {:ok, agent_run} <- mark_as_running(agent_run),
         {:ok, agent_run} <- execute_agent(agent_run) do
      mark_as_completed(agent_run)
    else
      {:error, reason} -> handle_error(agent_run_id, reason)
    end
  rescue
    e ->
      Logger.error("Failed to execute agent run #{job.args["agent_run_id"]}")
      Logger.error(Exception.format(:error, e, __STACKTRACE__))
      handle_error(job.args["agent_run_id"], Exception.message(e))
      {:error, e}
  end

  defp get_agent_run(agent_run_id) do
    query =
      from ar in AgentRun,
        where: ar.id == ^agent_run_id,
        preload: [agent_def: :person]

    case Operately.Repo.one(query) do
      nil -> {:error, "Agent run not found"}
      agent_run -> {:ok, agent_run}
    end
  end

  defp mark_as_running(agent_run) do
    agent_run
    |> AgentRun.changeset(%{status: :running})
    |> Repo.update()
  end

  defp execute_agent(agent_run) do
    person = agent_run.agent_def.person
    agent_def = agent_run.agent_def

    logs = Operately.AI.run_agent(person, agent_def, agent_run)

    Operately.People.AgentRun.append_log(agent_run.id, "\n" <> logs)

    {:ok, agent_run}
  end

  defp mark_as_completed(agent_run) do
    agent_run
    |> AgentRun.changeset(%{
      status: :completed,
      finished_at: DateTime.utc_now()
    })
    |> Repo.update()
  end

  defp handle_error(agent_run_id, reason) do
    case Repo.get(AgentRun, agent_run_id) do
      nil ->
        Logger.error("Could not find agent run #{agent_run_id} to mark as failed")
        {:error, reason}

      agent_run ->
        agent_run
        |> AgentRun.changeset(%{
          status: :failed,
          finished_at: DateTime.utc_now(),
          error_message: to_string(reason)
        })
        |> Repo.update()
    end
  end
end
