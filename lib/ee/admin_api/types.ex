defmodule OperatelyEE.AdminApi.Types do
  use TurboConnect.Types

  primitive :company_id,
    encoded_type: :string,
    decoded_type: :number,
    decode_with: &OperatelyWeb.Api.Ids.decode_company_id/1

  object :company do
    field :id, :string
    field :name, :string
    field :owners, list_of(:person)

    field :people_count, :integer
    field :goals_count, :integer
    field :spaces_count, :integer
    field :projects_count, :integer
    field :last_activity_at, :datetime
  end

  object :person do
    field :id, :string
    field :full_name, :string
    field :email, :string
    field :avatar_url, :string
  end

end
