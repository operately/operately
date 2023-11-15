defmodule OperatelyWeb.Graphql.Types.ActivityContentProjectMoved do
  use Absinthe.Schema.Notation

  object :activity_content_project_moved do
    field :project, non_null(:project) do
      resolve fn activity, _, _ ->
        project_id = activity.content["project_id"]

        project = Operately.Projects.get_project!(project_id)

        {:ok, project}
      end
    end

    field :old_space, non_null(:group) do
      resolve fn activity, _, _ ->
        old_space_id = activity.content["old_space_id"]
        space = Operately.Groups.get_group!(old_space_id)

        {:ok, space}
      end
    end

    field :new_space, non_null(:group) do
      resolve fn activity, _, _ ->
        new_space_id = activity.content["new_space_id"]
        space = Operately.Groups.get_group!(new_space_id)

        {:ok, space}
      end
    end
  end
end
