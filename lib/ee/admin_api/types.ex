defmodule OperatelyEE.AdminApi.Types do
  use TurboConnect.Types

  object :company do
    field :id, :string
    field :name, :string
    field :owners, list_of(:person)

    field :people_count, :integer
    field :goal_count, :integer
    field :project_count, :integer
  end

  object :person do
    field :id, :string
    field :full_name, :string
    field :email, :string
    field :avatar_url, :string
  end

end
