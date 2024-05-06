defmodule OperatelyWeb.Graphql.Queries.Activities do
  use Absinthe.Schema.Notation

  @deprecated_actions [
    "project_status_update_acknowledged",
    "project_status_update_commented",
    "project_status_update_edit",
  ]

  object :activity_queries do
    field :activity, non_null(:activity) do
      arg :id, non_null(:id)

      resolve fn _, args, _ ->
        {:ok, Operately.Activities.get_activity!(args.id)}
      end
    end

    field :activities, list_of(:activity) do
      arg :scope_type, non_null(:string)
      arg :scope_id, non_null(:string)

      resolve fn _, args, _ ->
        activities = Operately.Activities.list_activities(args.scope_type, args.scope_id)
        activities = Operately.Repo.preload(activities, :author)
        activities = Enum.filter(activities, fn activity -> activity.action not in @deprecated_actions end)

        {:ok, activities}
      end
    end
  end
end
