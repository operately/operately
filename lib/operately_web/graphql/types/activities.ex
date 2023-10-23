defmodule OperatelyWeb.Graphql.Types.Activities do
  use Absinthe.Schema.Notation

  object :activity do
    field :id, non_null(:id)
    field :scope_type, non_null(:string)
    field :scope_id, non_null(:id)
    field :resource_id, non_null(:id)
    field :resource_type, non_null(:string)
    field :action_type, non_null(:string)
    field :inserted_at, non_null(:naive_datetime)
    field :updated_at, non_null(:naive_datetime)

    field :author, non_null(:person) do
      resolve fn activity, _, _ ->
        {:ok, activity.author}
      end
    end

    field :resource, :activity_resource_union do
      resolve fn activity, _, _ ->
        {:ok, activity.resource}
      end
    end

    field :person, non_null(:person) do
      resolve fn activity, _, _ ->
        {:ok, activity.person}
      end
    end

    field :event_data, non_null(:activity_data_union) do
      resolve fn activity, _, _ ->
        {:ok, activity.event_data}
      end
    end

    field :content, non_null(:activity_content) do
      resolve fn activity, _, _ ->
        {:ok, activity}
      end
    end
  end

  union :activity_content do
    types [
      :activity_content_project_discussion_submitted,
      :activity_content_project_discussion_comment_submitted,
      :activity_content_project_status_update_submitted,
      :activity_content_project_status_update_acknowledged,
    ]

    resolve_type fn %{action: action}, _ ->
      String.to_atom("activity_content_#{action}")
    end
  end

  union :activity_resource_union do
    types [:project, :update, :milestone, :comment]

    resolve_type fn
      %Operately.Projects.Project{}, _ -> :project
      %Operately.Projects.Milestone{}, _ -> :milestone
      %Operately.Updates.Update{}, _ -> :update
      %Operately.Updates.Comment{}, _ -> :comment
      e, _ -> raise "Unknown activity resource: #{inspect(e)}"
    end
  end

  union :activity_data_union do
    types [
      :activity_event_data_project_create,
      :activity_event_data_milestone_create,
      :activity_event_data_comment_post,
    ]

    resolve_type fn %{"type" => type}, _ -> String.to_atom("activity_event_data_#{type}") end
  end

  object :activity_event_data_project_create do
    field :champion, :person do
      resolve fn data, _, _ ->
        champion_id = data["champion_id"]

        if champion_id do
          {:ok, Operately.People.get_person!(data["champion_id"])}
        else 
          {:ok, nil}
        end
      end
    end
  end

  object :activity_event_data_milestone_create do
    field :title, non_null(:string) do
      resolve fn data, _, _ ->
        {:ok, data["title"]}
      end
    end
  end

  object :activity_event_data_comment_post do
    field :update_id, non_null(:string) do
      resolve fn data, _, _ ->
        {:ok, data["update_id"]}
      end
    end
  end

end
