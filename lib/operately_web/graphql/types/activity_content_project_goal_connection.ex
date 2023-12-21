defmodule OperatelyWeb.Graphql.Types.ActivityContentProjectGoalConnection do
  use Absinthe.Schema.Notation

  object :activity_content_project_goal_connection do
    field :project, non_null(:project) do
      resolve fn activity, _, _ ->
        project_id = activity.content["project_id"]

        project = Operately.Projects.get_project!(project_id)

        {:ok, project}
      end
    end

    field :goal, non_null(:goal) do
      resolve fn activity, _, _ ->
        id = activity.content["goal_id"]

        {:ok, Operately.Goals.get_goal!(id)}
      end
    end
  end
end
