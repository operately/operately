defmodule OperatelyWeb.Graphql.Types.ActivityContentSpaceJoining do
  use Absinthe.Schema.Notation

  object :activity_content_space_joining do
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

    field :space, non_null(:group) do
      resolve fn activity, _, _ ->
        group = Operately.Groups.get_group!(activity.content["space_id"])
        {:ok, group}
      end
    end
  end
end
