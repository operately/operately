defmodule OperatelyWeb.Graphql.Mutations.Companies do
  use Absinthe.Schema.Notation

  input_object :add_company_member_input do
    field :full_name, non_null(:string)
    field :email, non_null(:string)
    field :title, :string
  end

  object :company_mutations do
    field :remove_company_admin, :person do
      arg :person_id, non_null(:id)

      resolve fn _, args, %{context: context} ->
        person = context.current_account.person

        Operately.Companies.remove_admin(person, args.person_id)
      end
    end

    field :add_company_admins, :boolean do
      arg :people_ids, list_of(non_null(:id))

      resolve fn _, args, %{context: context} ->
        person = context.current_account.person

        Operately.Companies.add_admins(person, args.people_ids)

        {:ok, true}
      end
    end

    field :add_company_member, non_null(:person) do
      arg :input, non_null(:add_company_member_input)

      resolve fn _, args, %{context: context} ->
        person = context.current_account.person

        Operately.Companies.add_member(person, args.input)
      end
    end
  end
end
