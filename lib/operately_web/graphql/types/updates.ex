defmodule OperatelyWeb.GraphQL.Types.Updates do
  use Absinthe.Schema.Notation

  object :update do
    field :id, non_null(:id)
    field :title, :string
    field :inserted_at, non_null(:naive_datetime)
    field :updated_at, non_null(:naive_datetime)
    field :acknowledged, non_null(:boolean)
    field :acknowledged_at, :naive_datetime

    field :previous_phase, :string
    field :new_phase, :string

    field :previous_health, :string
    field :new_health, :string

    field :project, :project do
      resolve fn update, _, _ ->
        project = Operately.Projects.get_project!(update.updatable_id)

        {:ok, project}
      end
    end

    field :acknowledging_person, :person do
      resolve fn update, _, _ ->
        if update.acknowledging_person_id == nil do
          {:ok, nil}
        else
          person = Operately.People.get_person!(update.acknowledging_person_id)
          {:ok, person}
        end
      end
    end

    field :message, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, Jason.encode!(update.content["message"])}
      end
    end

    field :message_type, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, update.type || "status_update"}
      end
    end

    field :comments, list_of(:comment) do
      resolve fn update, _, _ ->
        comments = Operately.Updates.list_comments(update.id)

        {:ok, comments}
      end
    end

    field :author, :person do
      resolve fn update, _, _ ->
        person = Operately.People.get_person!(update.author_id)

        {:ok, person}
      end
    end

    field :reactions, list_of(:reaction) do
      resolve fn update, _, _ ->
        reactions = Operately.Updates.list_reactions(update.id, :update)

        {:ok, reactions}
      end
    end

    field :content, :update_content do
      resolve fn update, _, _ ->
        {:ok, update}
      end
    end
  end

  union :update_content do
    types [
      :update_content_message,
      :update_content_project_created,
      :update_content_project_start_time_changed,
      :update_content_project_end_time_changed,
      :update_content_project_contributor_added,
      :update_content_project_milestone_created,
      :update_content_project_milestone_completed,
      :update_content_project_milestone_deadline_changed,
      :update_content_project_milestone_deleted,
      :update_content_status_update
    ]

    resolve_type fn %{type: type}, _ ->
      String.to_atom("update_content_#{type}") 
    end
  end
end
