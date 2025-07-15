defmodule Operately.Ai.PlanningPhase do
  alias Operately.People.AgentRun
  alias Operately.Repo

  @planning_message """
  Use the available information and tools to plan out the tasks for day. Do not post any messages or take any actions yet.
  Focus on identifying the tasks that need to be done, their order, and any dependencies.
  Create tasks by using the add_agent_task function. Save the details necessary to execute the tasks later.
  Make sure to include all relevant details in the task description.
  """

  def execute(run) do
    run
    |> clear_tasks()
    |> log_planning_start()
    |> run_planning_chain()
    |> mark_as_running()
    |> schedule_next_step()
    |> log_planning_end()
  end

  defp clear_tasks(run) do
    {:ok, _} = Operately.People.AgentRun.clear_tasks(run.id)
    run
  end

  defp log_planning_start(run) do
    Operately.People.AgentRun.append_log(run.id, "PLANNING STARTED\n")
    run
  end

  defp log_planning_end(run) do
    Operately.People.AgentRun.append_log(run.id, "PLANNING ENDED\n")
    run
  end

  defp run_planning_chain(run) do
    logs = Operately.AI.run_agent(run, @planning_message)
    Operately.People.AgentRun.append_log(run.id, "\n" <> logs <> "\n")
    run
  end

  defp schedule_next_step(run) do
    {:ok, _} = Operately.Ai.AgentWorker.new(%{agent_run_id: run.id}, schedule_in: 1) |> Oban.insert()
    run
  end

  defp mark_as_running(agent_run) do
    {:ok, run} = agent_run |> AgentRun.changeset(%{status: :running}) |> Repo.update()
    run
  end
end
