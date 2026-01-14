defmodule OperatelyWeb.Api.Mutations.AddCompanyMember do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  require Logger
  import Operately.Access.Filters, only: [filter_by_edit_access: 2]
  alias Operately.People

  inputs do
    field :full_name, :string, null: false
    field :email, :string, null: false
    field :title, :string, null: false
  end

  outputs do
    field :invite_link, :invite_link, null: false
    field :new_account, :boolean, null: false
  end

  def call(conn, inputs) do
    admin = me(conn)

    if admin_has_edit_access?(admin) do
      process_member_creation(admin, inputs)
    else
      {:error, :forbidden}
    end
  end

  defp admin_has_edit_access?(admin) do
    from(c in Operately.Companies.Company, where: c.id == ^admin.company_id)
    |> filter_by_edit_access(admin.id)
    |> Repo.exists?()
  end

  defp process_member_creation(admin, inputs) do
    case create_person(admin, inputs) do
      {:ok, nil} ->
        {:ok, %{invite_link: nil, new_account: false}}

      {:ok, invite_link} ->
        {:ok,
         %{
           invite_link: Serializer.serialize(invite_link, level: :full),
           new_account: true
         }}

      error ->
        error
    end
  end

  defp create_person(admin, inputs) do
    skip_invitation = not People.is_new_account?(inputs[:email])

    case Operately.Operations.CompanyMemberAdding.run(admin, inputs, skip_invitation) do
      {:ok, invite_link} ->
        {:ok, invite_link}

      {:error, [%{field: :email, message: message}]} ->
        {:error, :bad_request, "Email " <> message}

      {:error, [%{field: :full_name, message: message}]} ->
        {:error, :bad_request, "Name " <> message}

      {:error, [%{message: message}]} ->
        {:error, :bad_request, message}

      {:error, error} ->
        Logger.error("Unexpected error: #{inspect(error)}")
        raise "Unexpected error"
    end
  end
end
