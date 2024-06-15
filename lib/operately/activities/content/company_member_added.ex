defmodule Operately.Activities.Content.CompanyMemberAdded do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :invitatition, Operately.Invitations.Invitation

    field :name, :string
    field :email, :string
    field :title, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end

  def build(params) do
    changeset(params)
  end
end
