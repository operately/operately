defimpl OperatelyWeb.Api.Serializable, for: Operately.People.AgentRun do
  def serialize(run, level: :full) do
    %{
      started_at: OperatelyWeb.Api.Serializer.serialize(run.started_at, level: :full),
      logs: run.logs || "",
      status: run.status
    }
  end
end
