defmodule OperatelyEE.AdminApi.Types do
  use TurboConnect.Types

  primitive :company_id,
    encoded_type: :string,
    decoded_type: :number,
    decode_with: &OperatelyWeb.Api.Types.CompanyId.decode/1

  object :company do
    field? :id, :string
    field? :name, :string
    field? :owners, list_of(:person)

    field? :people_count, :integer
    field? :goals_count, :integer
    field? :spaces_count, :integer
    field? :projects_count, :integer
    field? :last_activity_at, :datetime
    field? :inserted_at, :datetime

    field? :uuid, :string
    field? :short_id, :string
    field? :enabled_features, list_of(:string)
  end

  object :person do
    field :id, :string
    field :full_name, :string
    field :email, :string
    field :avatar_url, :string
    field :title, :string
  end

  object :account do
    field :id, :string
    field :full_name, :string
    field :email, :string
    field :site_admin, :boolean
    field :companies_count, :integer
    field :owned_companies_count, :integer
    field :inserted_at, :datetime
  end

  object :activity do
    field? :id, :string
    field? :action, :string
    field? :inserted_at, :datetime
  end

  enum(:email_provider, values: Operately.SystemSettings.EmailConfig.provider_values())
  enum(:billing_behavior, values: [:internal, :provider_managed])

  object :smtp_settings do
    field :host, :string, null: false
    field :port, :integer, null: false
    field :username, :string, null: false
    field :ssl, :boolean, null: false
    field :tls_required, :boolean, null: false
    field? :smtp_password_set, :boolean, null: false
  end

  object :email_settings do
    field :provider, :email_provider, null: false
    field? :notification_email, :string, null: false
    field? :smtp, :smtp_settings, null: false
    field? :sendgrid_api_key_set, :boolean, null: false
  end

  object :billing_product do
    field :id, :string
    field :provider, :string
    field :plan_family, :string
    field :billing_interval, :string
    field :polar_product_id, :string
    field :polar_product_name, :string
    field :price_amount, :integer
    field :price_currency, :string
    field :version, :integer
    field :active, :boolean
    field :archived_at, :datetime
    field :last_synced_at, :datetime
    field :inserted_at, :datetime
    field :updated_at, :datetime
  end

  object :billing_plan_definition do
    field :id, :string
    field :key, :string
    field :display_name, :string
    field :sort_order, :integer
    field :tier_rank, :integer
    field :billing_behavior, :billing_behavior
    field :customer_selectable, :boolean
    field? :archived_at, :datetime, null: true
    field? :member_limit, :integer
    field? :storage_limit_bytes, :integer
  end
end
