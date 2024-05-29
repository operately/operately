defmodule OperatelyWeb.Api do
  use TurboConnect.Specs

  object :person do
    field :id, :string
    field :manager_id, :string

    field :full_name, :string
    field :title, :string
    field :avatar_url, :string
    field :timezone, :string
    field :company_role, :string
    field :email, :string

    field :send_daily_summary, :boolean
    field :notify_on_mention, :boolean
    field :notify_about_assignments, :boolean

    field :suspended, :boolean

    field :company, :company
    field :manager, :person
    field :theme, :string

    # field :reports, list_of(:person)
    # field :peers, list_of(:person)
  end

  object :company do
    field :id, :string
    field :name, :string
    field :mission, :string
    field :company_space_id, :string

    # field :trusted_email_domains, list_of(:string)
    # field :enabled_experimental_features, list_of(:string)

    # field :admins, list_of(:person)
    # field :people, list_of(:person)
  end

end
