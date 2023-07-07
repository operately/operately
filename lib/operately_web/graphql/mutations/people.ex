defmodule OperatelyWeb.GraphQL.Mutations.People do
  use Absinthe.Schema.Notation

  input_object :update_profile_input do
    field :full_name, :string
    field :title, :string
  end

  input_object :toggle_pin_input do
    field :id, non_null(:id)
    field :type, non_null(:string)
  end

  object :people_mutations do
    field :create_profile, :person do
      arg :full_name, non_null(:string)
      arg :title, non_null(:string)

      resolve fn _, args, _ ->
        Operately.People.create_person(args)
      end
    end

    field :update_profile, :person do
      arg :input, non_null(:update_profile_input)

      resolve fn _, args, %{context: context} ->
        person = context.current_account.person

        Operately.People.update_person(person, args.input)
      end
    end

    field :toggle_pin, :person do
      arg :input, non_null(:toggle_pin_input)

      resolve fn _, args, %{context: context} ->
        person = context.current_account.person

        Operately.People.toggle_pin(person, args.input)
      end
    end
  end
end
