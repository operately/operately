defmodule Operately.Support.Factory.AgentConvos do
  def add_agent_convo(ctx, testid, author, resource_name) do
    person = Map.fetch!(ctx, author)
    resource = Map.fetch!(ctx, resource_name)

    resource_type =
      case resource do
        %{__struct__: Operately.Goals.Goal} -> :goal
        %{__struct__: Operately.Projects.Project} -> :project
      end

    {:ok, convo} =
      Operately.People.AgentConvo.changeset(%{
        author_id: person.id,
        title: "Test Convo",
        goal_id: if(resource_type == :goal, do: resource.id, else: nil),
        project_id: if(resource_type == :project, do: resource.id, else: nil)
      })
      |> Operately.Repo.insert()

    Map.put(ctx, testid, convo)
  end
end
