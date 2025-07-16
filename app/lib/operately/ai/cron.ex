defmodule Operately.AI.Cron do
  use Oban.Worker, queue: :ai

  alias Operately.Repo
  alias Operately.People.AgentDef

  require Logger
  import Ecto.Query, only: [from: 2]

  @impl Oban.Worker
  def perform(_) do
    if is_workday?() do
      run_agents()
    else
      :ok
    end
  end

  def run_agents do
    from(a in AgentDef, where: a.daily_run == true)
    |> Repo.all()
    |> Enum.each(&run_agent/1)

    :ok
  end

  def run_agent(agent) do
    catch_and_log_errors(fn ->
      {:ok, _} = Operately.People.AgentRun.create(agent)
    end)
  end

  defp catch_and_log_errors(cb) do
    try do
      cb.()
    rescue
      e -> Logger.error("Error in Operately.AI.Cron: #{inspect(e)}")
    end
  end

  def is_workday? do
    Date.day_of_week(Date.utc_today()) in [1, 2, 3, 4, 5]
  end
end
