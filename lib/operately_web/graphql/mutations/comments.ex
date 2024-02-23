defmodule OperatelyWeb.Graphql.Mutations.Comments do
  use Absinthe.Schema.Notation

  input_object :create_comment_input do
    field :content, non_null(:string)
    field :update_id, non_null(:id)
  end

  input_object :edit_comment_input do
    field :content, non_null(:string)
    field :comment_id, non_null(:id)
  end

  object :comment_mutations do
    field :create_comment, :comment do
      arg :input, non_null(:create_comment_input)

      resolve fn args, %{context: context} ->
        update = Operately.Updates.get_update!(args.input.update_id)

        cond do
          update.type in [:project_discussion, :status_update, :review] ->
            author = context.current_account.person
            content = Jason.decode!(args.input.content)

            Operately.Updates.create_comment(author, update, content)

          true ->
            Operately.Updates.create_comment(update, %{
              author_id: context.current_account.person.id,
              update_id: args.input.update_id,
              content: %{"message" => Jason.decode!(args.input.content)}
            })
        end
      end
    end

    field :edit_comment, :comment do
      arg :input, non_null(:edit_comment_input)

      resolve fn args, _ ->
        comment = Operately.Updates.get_comment!(args.input.comment_id)

        Operately.Updates.update_comment(comment, %{
          content: %{"message" => Jason.decode!(args.input.content)}
        })
      end
    end
  end
end
