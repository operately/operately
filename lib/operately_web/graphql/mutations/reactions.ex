defmodule OperatelyWeb.Graphql.Mutations.Reactions do
  use Absinthe.Schema.Notation

  input_object :add_reaction_input do
    field :entity_id, non_null(:id)
    field :entity_type, non_null(:string)
    field :emoji, non_null(:string)
  end

  object :reaction_mutations do
    field :add_reaction, :reaction do
      arg :input, non_null(:add_reaction_input)

      resolve fn args, %{context: context} ->
        creator = context.current_account.person
        entity_id = args.input.entity_id
        entity_type = args.input.entity_type
        emoji = args.input.emoji

        Operately.Operations.ReactionAdding.run(creator, entity_id, entity_type, emoji)
      end
    end
  end
end
