defmodule Operately.AI.CronTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  setup do
    Factory.setup(%{})
    |> Factory.add_company_agent(:agent)
  end

  test "when daily run is true, the agent runs", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      enable_daily_run(ctx)

      Operately.AI.Cron.perform(nil)

      assert length(all_enqueued()) == 1
    end)
  end

  test "when daily run is false, the agent does not run", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      disable_daily_run(ctx)

      Operately.AI.Cron.perform(nil)

      assert length(all_enqueued()) == 0
    end)
  end

  defp enable_daily_run(ctx) do
    agent_def = Operately.Repo.preload(ctx.agent, :agent_def).agent_def
    {:ok, _agent_def} = Operately.People.AgentDef.changeset(agent_def, %{daily_run: true}) |> Operately.Repo.update()
  end

  defp disable_daily_run(ctx) do
    agent_def = Operately.Repo.preload(ctx.agent, :agent_def).agent_def
    {:ok, _agent_def} = Operately.People.AgentDef.changeset(agent_def, %{daily_run: false}) |> Operately.Repo.update()
  end
end
