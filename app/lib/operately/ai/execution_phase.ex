defmodule Operately.Ai.ExecutionPhase do
  alias Operately.People.AgentRun
  alias Operately.Repo

  def execute(run) do
    case pop_task(run) do
      nil ->
        run
        |> log_no_more_tasks()
        |> mark_as_completed()

      task ->
        run
        |> log_running_task(task)
        |> run_execution_chain(task)
        |> mark_task_completed(task["id"])
        |> schedule_next_step()
    end
  end

  defp pop_task(run) do
    run.tasks |> Enum.find(fn task -> task["status"] == "pending" end)
  end

  defp log_running_task(run, task) do
    Operately.People.AgentRun.append_log(run.id, "RUNNING TASK: #{task["name"]}\n")
    run
  end

  defp run_execution_chain(run, task) do
    logs = Operately.AI.run_agent(run, run.definition, [task["name"], run.task_execution_instructions])
    Operately.People.AgentRun.append_log(run.id, "\n" <> logs <> "\n")
    run
  end

  defp schedule_next_step(run) do
    {:ok, _} = Operately.Ai.AgentWorker.new(%{agent_run_id: run.id}, schedule_in: 1) |> Oban.insert()
    run
  end

  defp mark_task_completed(run, task_id) do
    Operately.People.AgentRun.mark_task_completed(run.id, task_id)
    run
  end

  defp log_no_more_tasks(run) do
    Operately.People.AgentRun.append_log(run.id, "NO MORE TASKS TO EXECUTE\n")
    run
  end

  defp mark_as_completed(agent_run) do
    agent_run |> AgentRun.changeset(%{status: :completed, finished_at: DateTime.utc_now()}) |> Repo.update()
  end
end
