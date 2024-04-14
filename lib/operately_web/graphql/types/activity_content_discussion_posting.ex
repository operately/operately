defmodule OperatelyWeb.Graphql.Types.ActivityContentDiscussionPosting do
  use Absinthe.Schema.Notation

  object :activity_content_discussion_posting do
    field :company_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["company_id"]}
      end
    end
    
    field :space_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["space_id"]}
      end
    end
    
    field :title, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["title"]}
      end
    end
    
    field :discussion_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["discussion_id"]}
      end
    end

    field :space, non_null(:group) do
      resolve fn activity, _, _ ->
        group = Operately.Groups.get_group!(activity.content["space_id"])
        {:ok, group}
      end
    end

    field :discussion, non_null(:discussion) do
      resolve fn activity, _, _ ->
        update = Operately.Updates.get_update!(activity.content["discussion_id"])
        {:ok, update}
      end
    end
  end
end
