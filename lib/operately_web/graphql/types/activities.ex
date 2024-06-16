defmodule OperatelyWeb.Graphql.Types.Activities do
  use Absinthe.Schema.Notation

  import OperatelyWeb.Graphql.TypeHelpers

  scalar :utc_datetime, description: "ISO8601 encoded UTC datetime" do
    parse &parse_datetime/1
    serialize &serialize_datetime/1
  end

  object :activity do
    field :id, non_null(:id)
    field :scope_type, non_null(:string)
    field :scope_id, non_null(:id)
    field :resource_id, non_null(:id)
    field :resource_type, non_null(:string)
    field :action_type, non_null(:string)
    field :action, non_null(:string)
    field :inserted_at, non_null(:utc_datetime) do
      resolve &resolve_inserted_at/3
    end
    field :updated_at, non_null(:utc_datetime)

    assoc_field :comment_thread, :comment_thread
    assoc_field :author, non_null(:person)

    field :resource, :activity_resource_union do
      resolve &resolve_resource/3
    end

    field :person, non_null(:person) do
      resolve &resolve_person/3
    end

    field :event_data, non_null(:activity_data_union) do
      resolve &resolve_event_data/3
    end

    field :content, non_null(:activity_content) do
      resolve &resolve_content/3
    end
  end

  defp parse_datetime(%Absinthe.Blueprint.Input.String{value: value}) do
    case DateTime.from_iso8601(value) do
      {:ok, datetime, _offset} -> {:ok, datetime}
      _ -> :error
    end
  end

  defp serialize_datetime(%DateTime{} = datetime), do: DateTime.to_iso8601(datetime)
  defp serialize_datetime(%NaiveDateTime{} = naive_datetime) do
    {:ok, datetime} = DateTime.from_naive(naive_datetime, "Etc/UTC")
    DateTime.to_iso8601(datetime)
  end
  defp serialize_datetime(_), do: :error

  defp resolve_inserted_at(activity, _, _) do
    {:ok, activity.inserted_at}
  end

  defp resolve_resource(activity, _, _) do
    {:ok, activity.resource}
  end

  defp resolve_person(activity, _, _) do
    {:ok, activity.person}
  end

  defp resolve_event_data(activity, _, _) do
    {:ok, activity.event_data}
  end

  defp resolve_content(activity, _, _) do
    {:ok, activity}
  end

  union :activity_resource_union do
    types [:project, :update, :milestone, :comment]

    resolve_type &resolve_activity_resource_type/2
  end

  defp resolve_activity_resource_type(%Operately.Projects.Project{}, _), do: :project
  defp resolve_activity_resource_type(%Operately.Projects.Milestone{}, _), do: :milestone
  defp resolve_activity_resource_type(%Operately.Updates.Update{}, _), do: :update
  defp resolve_activity_resource_type(%Operately.Updates.Comment{}, _), do: :comment
  defp resolve_activity_resource_type(e, _), do: raise "Unknown activity resource: #{inspect(e)}"

  union :activity_data_union do
    types [
      :activity_event_data_project_create,
      :activity_event_data_milestone_create,
      :activity_event_data_comment_post,
    ]

    resolve_type &resolve_activity_data_type/2
  end

  defp resolve_activity_data_type(%{"type" => type}, _), do: String.to_atom("activity_event_data_#{type}")

  object :activity_event_data_project_create do
    field :champion, :person do
      resolve &resolve_champion/3
    end
  end

  defp resolve_champion(data, _, _) do
    champion_id = data["champion_id"]

    if champion_id do
      {:ok, Operately.People.get_person!(champion_id)}
    else
      {:ok, nil}
    end
  end

  object :activity_event_data_milestone_create do
    field :title, non_null(:string) do
      resolve &resolve_title/3
    end
  end

  defp resolve_title(data, _, _) do
    {:ok, data["title"]}
  end

  object :activity_event_data_comment_post do
    field :update_id, non_null(:string) do
      resolve &resolve_update_id/3
    end
  end

  defp resolve_update_id(data, _, _) do
    {:ok, data["update_id"]}
  end
end
