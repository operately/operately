defmodule OperatelyWeb.Graphql.Types.Person do
  use Absinthe.Schema.Notation
  import OperatelyWeb.Graphql.TypeHelpers

  object :person do
    field :id, non_null(:id)
    field :manager_id, :string

    field :full_name, non_null(:string)
    field :title, :string
    field :avatar_url, :string
    field :timezone, :string
    field :avatar_blob_id, :id
    field :company_role, :string
    field :email, :string

    field :send_daily_summary, non_null(:boolean)
    field :notify_on_mention, non_null(:boolean)
    field :notify_about_assignments, non_null(:boolean)

    field :suspended, non_null(:boolean)

    field :company, non_null(:company) do
      resolve fn person, _, _ ->
        {:ok, Operately.Companies.get_company!(person.company_id)}
      end
    end

    delegate_field :manager, :person, &Operately.People.get_manager/1
    delegate_field :reports, list_of(:person), &Operately.People.get_reports/1
    delegate_field :peers, list_of(:person), &Operately.People.get_peers/1
    delegate_field :theme, :string, &Operately.People.get_theme/1
  end
end
