defmodule Operately.InviteLinks do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.InviteLinks.InviteLink
  alias Ecto.Multi

  require Logger

  def list_invite_links_for_company(company_id) do
    from(il in InviteLink,
      where: il.company_id == ^company_id,
      order_by: [desc: il.inserted_at],
      preload: [:author, :company]
    )
    |> Repo.all()
  end

  def get_invite_link!(id), do: Repo.get!(InviteLink, id)

  def get_invite_link_by_token(nil), do: {:error, :not_found}

  def get_invite_link_by_token(token) when is_binary(token) do
    from(il in InviteLink,
      where: il.token == ^token,
      preload: [:author, :company]
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      invite_link -> {:ok, invite_link}
    end
  end

  def create_invite_link(attrs \\ %{}) do
    token = InviteLink.build_token()

    attrs_with_token = Map.put(attrs, :token, token)

    %InviteLink{}
    |> InviteLink.changeset(attrs_with_token)
    |> Repo.insert()
  end

  def update_invite_link(%InviteLink{} = invite_link, attrs) do
    invite_link
    |> InviteLink.changeset(attrs)
    |> Repo.update()
  end

  def revoke_invite_link(%InviteLink{} = invite_link) do
    update_invite_link(invite_link, %{is_active: false})
  end

  def increment_use_count(%InviteLink{} = invite_link) do
    update_invite_link(invite_link, %{use_count: invite_link.use_count + 1})
  end

  def delete_invite_link(%InviteLink{} = invite_link) do
    Repo.delete(invite_link)
  end

  def change_invite_link(%InviteLink{} = invite_link, attrs \\ %{}) do
    InviteLink.changeset(invite_link, attrs)
  end

  def get_users_joined_via_link(_invite_link_id) do
    raise "Not implemented yet"
  end

  def validate_invite_link(link) do
    if InviteLink.is_valid?(link) do
      {:ok, link}
    else
      {:error, :invite_link_invalid}
    end
  end

  def join_company_via_invite_link(account, token) do
    Multi.new()
    |> Multi.run(:invite_link, fn _, _ ->
      get_invite_link_by_token(token)
    end)
    |> Multi.run(:validate_invite_link, fn _, %{invite_link: invite_link} ->
      validate_invite_link(invite_link)
    end)
    |> Multi.run(:person, fn _, %{invite_link: invite_link} ->
      Operately.People.create_person(%{
        full_name: account.full_name,
        email: account.email,
        company_id: invite_link.company_id,
        account_id: account.id
      })
    end)
    |> Multi.run(:invite_link_update, fn _repo, %{invite_link: invite_link} ->
      increment_use_count(invite_link)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{person: person, invite_link: invite_link}} ->
        Logger.info("Successfully created person #{person.id} for company #{invite_link.company_id} via invite link")
        {:ok, {:person_created, person}}

      {:error, :person, changeset, _changes} ->
        Logger.error("Failed to create person via invite link: #{inspect(changeset)}")
        {:ok, :person_creation_failed}

      {:error, :invite_link_update, reason, _changes} ->
        Logger.error("Failed to increment invite link use count: #{inspect(reason)}")
        {:ok, :person_creation_failed}
    end
  end
end
