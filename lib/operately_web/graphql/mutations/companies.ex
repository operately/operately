defmodule OperatelyWeb.Graphql.Mutations.Companies do
  use Absinthe.Schema.Notation

  input_object :add_company_member_input do
    field :full_name, non_null(:string)
    field :email, non_null(:string)
    field :title, :string
  end

  input_object :add_first_company_input do
    field :company_name, non_null(:string)
    field :full_name, non_null(:string)
    field :email, non_null(:string)
    field :role, :string
    field :password, non_null(:string)
    field :password_confirmation, non_null(:string)
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

    field :add_company_trusted_email_domain, non_null(:company) do
      arg :company_id, non_null(:id)
      arg :domain, non_null(:string)

      resolve fn _, args, %{context: context} ->
        person = context.current_account.person
        company = Operately.Companies.get_company!(args.company_id)

        Operately.Companies.add_trusted_email_domain(company, person, args.domain)
      end
    end

    field :remove_company_trusted_email_domain, non_null(:company) do
      arg :company_id, non_null(:id)
      arg :domain, non_null(:string)

      resolve fn _, args, %{context: context} ->
        person = context.current_account.person
        company = Operately.Companies.get_company!(args.company_id)

        Operately.Companies.remove_trusted_email_domain(company, person, args.domain)
      end
    end

    field :add_first_company, non_null(:company) do
      arg :input, non_null(:add_first_company_input)

      resolve fn _, %{input: input}, _ ->
        allowed = Operately.Companies.count_companies() == 0

        if allowed do
          Operately.Operations.CompanyAdding.run(input)
        else
          {:error, nil}
        end
      end
    end
  end
end
