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

  object :activity do
    field? :id, :string
    field? :action, :string
    field? :inserted_at, :datetime
  end

end
