defmodule OperatelyWeb.Api.ExecutionPhaseTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo
  import Mock

  setup do
    Factory.setup(%{})
    |> Factory.add_company_agent(:agent)
    |> create_run()
  end

  test "when all the tasks are completed, the status is changed from running to completed", ctx do
    ctx = complete_all_tasks(ctx)
    ctx = execute(ctx)

    assert ctx.agent_run.status == :completed
  end

  test "if not all tasks are completed, the status remains running", ctx do
    ctx = execute(ctx)
    assert Enum.count(ctx.agent_run.tasks, fn task -> task["status"] != "completed" end) == 1
    assert ctx.agent_run.status == :running
  end

  test "it processes a task", ctx do
    assert Enum.count(ctx.agent_run.tasks, fn task -> task["status"] == "completed" end) == 0
    ctx = execute(ctx)
    assert Enum.count(ctx.agent_run.tasks, fn task -> task["status"] == "completed" end) == 1
  end

  #
  # Simulate the AI planning phase execution
  #

  defp create_run(ctx) do
    agent = Operately.Repo.preload(ctx.agent, :agent_def)
    {:ok, run} = Operately.People.AgentRun.create(agent.agent_def, false)
    {:ok, _} = Operately.People.AgentRun.changeset(run, %{status: :running}) |> Operately.Repo.update()

    {:ok, _} = Operately.People.AgentRun.add_task(run, "Verify goal Improve customer satisfaction")
    {:ok, _} = Operately.People.AgentRun.add_task(run, "Check Improve customer satisfaction progress")

    {:ok, Map.put(ctx, :agent_run, Operately.Repo.reload(run))}
  end

  defp execute(ctx) do
    run = Operately.Repo.reload(ctx.agent_run)

    with_mock Operately.AI, run_agent: &simulate_run/2 do
      Oban.Testing.with_testing_mode(:manual, fn ->
        Operately.Ai.ExecutionPhase.execute(run)
      end)
    end

    Map.put(ctx, :agent_run, Operately.Repo.reload(run))
  end

  defp simulate_run(_run, _message) do
    "Execution simulated successfully."
  end

  defp complete_all_tasks(ctx) do
    {:ok, run} = Operately.People.AgentRun.get_by_id(ctx.agent_run.id)

    Enum.each(run.tasks, fn task ->
      Operately.People.AgentRun.mark_task_completed(run.id, task["id"])
    end)

    Map.put(ctx, :agent_run, Operately.Repo.reload(run))
  end
end
