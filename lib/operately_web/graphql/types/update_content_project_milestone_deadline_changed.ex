defmodule OperatelyWeb.GraphQL.Types.UpdateContentProjectMilestoneDeadlineChanged do
  use Absinthe.Schema.Notation

  object :update_content_project_milestone_deadline_changed do
    field :old_deadline, :string do
      resolve fn update, _, _ ->
        {:ok, update.content["old_milestone_deadline"]}
      end
    end

    field :new_deadline, :string do
      resolve fn update, _, _ ->
        {:ok, update.content["new_milestone_deadline"]}
      end
    end

    field :milestone, non_null(:milestone) do
      resolve fn update, _, _ ->
        milestone = Operately.Projects.get_milestone!(update.content["milestone_id"], with_deleted: true)

        {:ok, milestone}
      end
    end
  end
end
