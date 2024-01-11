defmodule OperatelyWeb.Graphql.Types.Person do
  use Absinthe.Schema.Notation

  object :person do
    field :id, non_null(:id)
    field :full_name, non_null(:string)
    field :title, :string
    field :avatar_url, :string
    field :company_role, :string
    field :email, :string

    field :theme, :string do
      resolve fn person, _, _ ->
        {:ok, person.theme || "system"}
      end
    end

    field :send_daily_summary, non_null(:boolean)
    field :notify_on_mention, non_null(:boolean)
    field :notify_about_assignments, non_null(:boolean)

    field :company, non_null(:company) do
      resolve fn person, _, _  ->
        company = Operately.Companies.get_company!(person.company_id)

        {:ok, company}
      end
    end

    field :manager_id, :string

    field :manager, :person do
      resolve fn person, _, _ ->
        {:ok, Operately.People.get_manager(person)}
      end
    end

    field :reports, list_of(:person) do
      resolve fn person, _, _ ->
        reports = Operately.People.get_reports(person)
        {:ok, reports}
      end
    end
  end
end
