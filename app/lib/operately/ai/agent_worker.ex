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
    id = job.args["agent_run_id"]

    case AgentRun.get_by_id(id) do
      {:ok, agent_run} ->
        process_agent_run(agent_run)

      {:error, reason} ->
        Logger.error("Failed to fetch agent run #{id}: #{reason}")
        {:error, reason}
    end
  end

  defp process_agent_run(run) do
    case run.status do
      :planning -> Operately.Ai.PlanningPhase.execute(run)
      :running -> Operately.Ai.ExecutionPhase.execute(run)
      _ -> {:error, "Invalid agent run status: #{run.status}"}
    end
  end
end
