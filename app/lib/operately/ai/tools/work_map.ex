defmodule Operately.AI.Tools.WorkMap do
  alias Operately.AI.Tools.Base
  alias Operately.WorkMaps.GetWorkMapQuery

  def work_map do
    Base.new_tool(%{
      name: "get_work_map",
      description: "Returns all goals and projects for a given person.",
      function: fn _, context ->
        person = Map.get(context, :person)

        {:ok, workmap} = GetWorkMapQuery.execute(person, %{company_id: person.company_id})
        api_serialized = OperatelyWeb.Api.Serializer.serialize(workmap, level: :essential)

        {:ok, Operately.MDRender.render(api_serialized)}
      end
    })
  end
end
