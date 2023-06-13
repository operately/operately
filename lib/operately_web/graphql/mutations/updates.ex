defmodule OperatelyWeb.GraphQL.Mutations.Updates do
  use Absinthe.Schema.Notation

  input_object :create_update_input do
    field :content, non_null(:string)
    field :updatable_id, non_null(:id)
    field :updatable_type, non_null(:string)
  end

  object :update_mutations do
    field :create_update, :activity do
      arg :input, non_null(:create_update_input)

      resolve fn args, %{context: context} ->
        content = Jason.decode!(args.input.content)

        Operately.Updates.create_update(%{
          updatable_type: args.input.updatable_type,
          updatable_id: args.input.updatable_id,
          author_id: context.current_account.person.id,
          type: :status_update,
          content: %{"message" => content}
        })
      end
    end

    field :add_reaction, :reaction do
      arg :id, non_null(:id)
      arg :type, non_null(:string)

      resolve fn args, %{context: context} ->
        Operately.Updates.create_reaction(%{
          entity_type: :update,
          entity_id: args.id,
          reaction_type: args.type,
          person_id: context.current_account.person.id
        })
      end
    end

    field :acknowledge, :activity do
      arg :id, non_null(:id)

      resolve fn args, %{context: context} ->
        update = Operately.Updates.get_update!(args.id)

        Operately.Updates.update_update(update, %{
          acknowledged: true,
          acknowledged_at: DateTime.utc_now,
          acknowledged_person_id: context.current_account.person.id
        })
      end
    end
  end
end
