defmodule OperatelyWeb.Graphql.Mutations.Discussions do
  use Absinthe.Schema.Notation

  input_object :post_discussion_input do
    field :title, non_null(:string)
    field :message, non_null(:string)
  end

  object :discussion_mutations do 
    field :post_discussion, :discussion do
      arg :input, non_null(:post_discussion_input)

      resolve fn _, args, %{context: context} ->
        person = context.current_account.person
        title = args.input.title
        message = args.input.message

        Operately.Operations.DiscussionPosting.run(person, title, message)
      end
    end
  end

end
