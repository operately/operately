defmodule Operately.InviteLinks do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.InviteLinks.InviteLink

  def list_invite_links_for_company(company_id) do
    from(il in InviteLink,
      where: il.company_id == ^company_id,
      order_by: [desc: il.inserted_at],
      preload: [:author, :company]
    )
    |> Repo.all()
  end

  def get_invite_link!(id), do: Repo.get!(InviteLink, id)

  def get_invite_link_by_token(token) when is_binary(token) do
    from(il in InviteLink,
      where: il.token == ^token,
      preload: [:author, :company]
    )
    |> Repo.one()
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
    # This will be implemented when we add the join tracking
    # For now, return empty list
    []
  end
end
