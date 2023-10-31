defmodule OperatelyWeb.Graphql.Types.ActivityContentProjectTimelineEdited do
  use Absinthe.Schema.Notation

  object :activity_content_project_timeline_edited do
    field :project, non_null(:project) do
      resolve fn activity, _, _ ->
        project_id = activity.content["project_id"]

        project = Operately.Projects.get_project!(project_id)

        {:ok, project}
      end
    end
  end
end
