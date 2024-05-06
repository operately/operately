defmodule OperatelyWeb.Graphql.Queries.Activities do
  use Absinthe.Schema.Notation

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
      arg :with_non_empty_comments_thread, :boolean
      arg :actions, list_of(:string)

      resolve fn _, args, _ ->
        actions = args.actions || []

        activities = Operately.Activities.list_activities(
          args.scope_type, 
          args.scope_id, 
          actions,
          args.with_non_empty_comments_thread
        )

        activities = Operately.Repo.preload(activities, :author)

        {:ok, activities}
      end
    end
  end
end
