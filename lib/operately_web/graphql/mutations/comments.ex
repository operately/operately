defmodule OperatelyWeb.Graphql.Mutations.Comments do
  use Absinthe.Schema.Notation

  input_object :create_comment_input do
    field :entity_id, non_null(:string)
    field :entity_type, non_null(:string)
    field :content, non_null(:string)
  end

  input_object :edit_comment_input do
    field :content, non_null(:string)
    field :comment_id, non_null(:id)
  end

  object :comment_mutations do
    field :create_comment, :comment do
      arg :input, non_null(:create_comment_input)

      resolve fn args, %{context: context} ->
        author = context.current_account.person
        entity_id = args.input.entity_id
        entity_type = args.input.entity_type
        content = Jason.decode!(args.input.content)

        Operately.Operations.CommentAdding.run(author, entity_id, entity_type, content)
      end
    end

    field :edit_comment, :comment do
      arg :input, non_null(:edit_comment_input)

      resolve fn args, _ ->
        comment_id = args.input.comment_id
        content = Jason.decode!(args.input.content)

        Operately.Operations.CommentEditing.run(comment_id, content)
      end
    end
  end
end
