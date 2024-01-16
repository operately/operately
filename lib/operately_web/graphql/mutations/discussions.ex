defmodule OperatelyWeb.Graphql.Mutations.Discussions do
  use Absinthe.Schema.Notation

  input_object :post_discussion_input do
    field :space_id, non_null(:id)
    field :title, non_null(:string)
    field :body, non_null(:string)
  end

  object :discussion_mutations do 
    field :post_discussion, :discussion do
      arg :input, non_null(:post_discussion_input)

      resolve fn _, args, %{context: context} ->
        person = context.current_account.person
        title = args.input.title
        body = args.input.body
        space = Operately.Groups.get_group!(args.input.space_id)

        Operately.Operations.DiscussionPosting.run(person, space, title, body)
      end
    end
  end

end
