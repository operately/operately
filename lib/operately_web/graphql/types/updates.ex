defmodule OperatelyWeb.GraphQL.Types.Updates do
  use Absinthe.Schema.Notation

  interface :activity do
    field :id, non_null(:id)
    field :updateable_id, non_null(:id)
    field :inserted_at, non_null(:naive_datetime)
    field :author, :person

    resolve_type fn
      %{type: :status_update}, _ -> :activity_status_update
      %{type: :created}, _ -> :activity_created
    end
  end

  object :activity_status_update do
    field :id, non_null(:id)
    field :updateable_id, non_null(:id)
    field :inserted_at, non_null(:naive_datetime)

    field :acknowledged, non_null(:boolean)
    field :acknowledged_at, :naive_datetime

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

    interface :activity
  end

  object :activity_created do
    field :id, non_null(:id)
    field :updateable_id, non_null(:id)
    field :inserted_at, non_null(:naive_datetime)

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

    interface :activity
  end
end
