defmodule Operately.AI.PlanningPhaseTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo
  import Mock

  setup do
    Factory.setup(%{})
    |> Factory.add_company_agent(:agent)
    |> execute()
  end

  test "when planning phase is done, the status is changed from planning to running", ctx do
    assert ctx.agent_run.status == :running
  end

  test "when starting the planning phase, the PLANNING STARTED message is logged", ctx do
    assert ctx.agent_run.logs =~ "PLANNING STARTED"
  end

  test "when the planning phase is finished, the PLANNING ENDED message is logged", ctx do
    assert ctx.agent_run.logs =~ "PLANNING ENDED"
  end

  test "on completion, a new oban task is scheduled", ctx do
    assert_enqueued(worker: Operately.Ai.AgentWorker, args: %{agent_run_id: ctx.agent_run.id})
  end

  #
  # Simulate the AI planning phase execution
  #

  defp execute(ctx) do
    agent = Operately.Repo.preload(ctx.agent, :agent_def)
    {:ok, run} = Operately.People.AgentRun.create(agent.agent_def, false)

    with_mock Operately.AI, run_agent: &simulate_run/3 do
      Oban.Testing.with_testing_mode(:manual, fn ->
        Operately.Ai.PlanningPhase.execute(run)
      end)
    end

    {:ok, Map.put(ctx, :agent_run, Operately.Repo.reload(run))}
  end

  defp simulate_run(run, _definition, _instructions) do
    add_task = Operately.AI.Tools.add_agent_task()
    add_task.function.(%{"name" => "Verify goal Improve customer satisfaction"}, %{agent_run: run})
    add_task.function.(%{"name" => "Check Improve customer satisfaction progress"}, %{agent_run: run})

    "Task planning simulated successfully."
  end
end
