defmodule OperatelyWeb.Graphql.Types.ActivityContentProjectMilestoneCommented do
  use Absinthe.Schema.Notation

  object :activity_content_project_milestone_commented do
    field :project_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["project_id"]}
      end
    end

    field :project, non_null(:project) do
      resolve fn activity, _, _ ->
        project_id = activity.content["project_id"]

        project = Operately.Projects.get_project!(project_id)

        {:ok, project}
      end
    end

    field :milestone, non_null(:milestone) do
      resolve fn activity, _, _ ->
        milestone_id = activity.content["milestone_id"]

        milestone = Operately.Projects.get_milestone!(milestone_id)

        {:ok, milestone}
      end
    end

    field :comment_action, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["comment_action"]}
      end
    end

    field :comment, non_null(:comment) do
      resolve fn activity, _, _ ->
        comment_id = activity.content["comment_id"]
        comment = Operately.Updates.get_comment!(comment_id)

        {:ok, comment}
      end
    end
  end
end
