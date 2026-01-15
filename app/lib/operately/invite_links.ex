defmodule Operately.InviteLinks do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.InviteLinks.InviteLink

  def list_invite_links_for_company(company_id) do
    from(il in InviteLink,
      where: il.company_id == ^company_id and il.type == :company_wide,
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

  def get_personal_invite_link_by_token(token, opts \\ [])

  def get_personal_invite_link_by_token(nil, _opts), do: {:error, :not_found}

  def get_personal_invite_link_by_token(token, opts) when is_binary(token) do
    preload = Keyword.get(opts, :preload, [])

    from(il in InviteLink,
      where: il.token == ^token and il.type == :personal and not is_nil(il.person_id),
      preload: ^preload
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      invite_link -> {:ok, invite_link}
    end
  end

  def fetch_or_create_invite_link(attrs) do
    case get_invite_link(attrs.company_id) do
      {:error, :not_found} -> create_invite_link(attrs)
      {:ok, invite_link} -> {:ok, invite_link}
    end
  end

  def get_invite_link(company_id) do
    from(il in InviteLink,
      where: il.company_id == ^company_id and il.type == :company_wide,
      order_by: [desc: il.inserted_at],
      limit: 1
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      invite_link -> {:ok, invite_link}
    end
  end

  def create_invite_link(attrs \\ %{}) do
    token = InviteLink.build_token()

    attrs_with_token =
      attrs
      |> Map.put(:token, token)
      |> Map.put(:type, :company_wide)
      |> Map.put(:person_id, nil)

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

  def activate_invite_link(%InviteLink{} = invite_link) do
    update_invite_link(invite_link, %{is_active: true})
  end

  def reset_invite_link_token(%InviteLink{} = invite_link) do
    new_token = InviteLink.build_token()
    update_invite_link(invite_link, %{token: new_token})
  end

  def create_personal_invite_link(attrs) do
    token = InviteLink.build_token()
    expires_at = personal_invite_expires_at()

    attrs_with_token =
      attrs
      |> Map.put(:token, token)
      |> Map.put(:type, :personal)
      |> Map.put(:expires_at, expires_at)
      |> Map.put(:allowed_domains, [])

    %InviteLink{}
    |> InviteLink.changeset(attrs_with_token)
    |> Repo.insert()
  end

  def refresh_personal_invite_link(%InviteLink{} = invite_link) do
    new_token = InviteLink.build_token()
    expires_at = personal_invite_expires_at()

    update_invite_link(invite_link, %{token: new_token, expires_at: expires_at, is_active: true, type: :personal})
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

  def validate_invite_link(link, account) do
    cond do
      link.is_active == false ->
        {:error, :invite_link_inactive}

      not allowed_for_account?(link.allowed_domains, account) ->
        {:error, :invite_link_domain_not_allowed}

      true ->
        {:ok, link}
    end
  end

  def validate_personal_invite_link(link) do
    cond do
      link.is_active == false ->
        {:error, :invite_link_inactive}

      invite_link_expired?(link) ->
        {:error, :invite_link_expired}

      true ->
        {:ok, link}
    end
  end

  defdelegate join_company_via_invite_link(account, token), to: Operately.Operations.CompanyJoiningViaInviteLink, as: :run

  def get_personal_invite_link_for_person(person_id) when is_binary(person_id) do
    from(il in InviteLink,
      where: il.person_id == ^person_id and il.type == :personal,
      order_by: [desc: il.inserted_at],
      limit: 1
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      invite_link -> {:ok, invite_link}
    end
  end

  defp allowed_for_account?(allowed_domains, account) do
    allowed_domains = allowed_domains || []

    if Enum.empty?(allowed_domains) do
      true
    else
      case account_email_domain(account) do
        nil -> false
        domain -> domain in allowed_domains
      end
    end
  end

  defp account_email_domain(%{email: email}), do: account_email_domain(email)

  defp account_email_domain(email) when is_binary(email) do
    email
    |> String.trim()
    |> String.downcase()
    |> String.split("@")
    |> case do
      [_, domain] when domain != "" -> domain
      _ -> nil
    end
  end

  defp account_email_domain(_), do: nil

  defp invite_link_expired?(%InviteLink{expires_at: nil}), do: false

  defp invite_link_expired?(%InviteLink{expires_at: expires_at}) do
    DateTime.compare(expires_at, DateTime.utc_now()) != :gt
  end

  defp personal_invite_expires_at() do
    DateTime.utc_now()
    |> DateTime.add(24 * 60 * 60, :second)
    |> DateTime.truncate(:second)
  end
end
