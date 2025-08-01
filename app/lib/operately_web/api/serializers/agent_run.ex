defimpl OperatelyWeb.Api.Serializable, for: Operately.People.AgentRun do
  def serialize(run, level: :full) do
    %{
      id: OperatelyWeb.Paths.agent_run_id(run),
      started_at: OperatelyWeb.Api.Serializer.serialize(run.started_at, level: :full),
      logs: run.logs || "",
      status: run.status,
      sandbox_mode: run.sandbox_mode
    }
  end
end
