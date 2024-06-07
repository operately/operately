defmodule Operately.Access.Context do
  use Operately.Schema

  schema "access_contexts" do

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(context, attrs) do
    context
    |> cast(attrs, [])
    |> validate_required([])
  end
end
