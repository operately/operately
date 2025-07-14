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

    case get_agent_run(agent_run_id) do
      {:ok, agent_run} ->
        process_agent_run(agent_run)

      {:error, reason} ->
        Logger.error("Failed to fetch agent run #{agent_run_id}: #{reason}")
        {:error, reason}
    end
  end

  defp process_agent_run(agent_run) do
    case agent_run.status do
      :planning ->
        plan_agent_run(agent_run)

      :running ->
        # execute_agent_run(agent_run)
        {:ok, agent_run}

      :completed ->
        {:ok, agent_run}

      _ ->
        {:error, "Invalid agent run status: #{agent_run.status}"}
    end
  end

  def plan_agent_run(agent_run) do
    person = agent_run.agent_def.person
    agent_def = agent_run.agent_def

    {:ok, _} = Operately.People.AgentRun.clear_tasks(agent_run.id)

    Operately.People.AgentRun.append_log(agent_run.id, "PLANNING STARTED\n")

    logs =
      Operately.AI.run_agent(person, agent_def, agent_run, """
      Use the available information and tools to plan out the tasks for day. Do not post any messages or take any actions yet.
      Focus on identifying the tasks that need to be done, their order, and any dependencies.
      Create tasks by using the add_agent_task function. Save the details necessary to execute the tasks later.
      Make sure to include all relevant details in the task description.
      """)

    Operately.People.AgentRun.append_log(agent_run.id, "\n" <> logs)

    {:ok, _} = mark_as_running(agent_run)

    {:ok, agent_run}
  end

  defp execute_agent(agent_run) do
    person = agent_run.agent_def.person
    agent_def = agent_run.agent_def

    Operately.People.AgentRun.append_log("EXECUTION STARTED\n")

    logs = Operately.AI.run_agent(person, agent_def, agent_run)

    Operately.People.AgentRun.append_log(agent_run.id, "\n" <> logs)

    {:ok, agent_run}
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
    agent_run |> AgentRun.changeset(%{status: :running}) |> Repo.update()
  end

  defp mark_as_completed(agent_run) do
    agent_run |> AgentRun.changeset(%{status: :completed, finished_at: DateTime.utc_now()}) |> Repo.update()
  end
end
