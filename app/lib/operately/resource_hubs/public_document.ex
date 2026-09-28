defmodule Operately.ResourceHubs.PublicDocument do
  import Ecto.Query

  alias Operately.Repo
  alias Operately.ResourceHubs.Document

  defstruct [:name, :content, :published_at, :updated_at]

  def get(token) do
    with {:ok, document} <- find_document(token) do
      {:ok, %__MODULE__{name: document.name, content: public_content(document.content, token), published_at: document.published_at, updated_at: document.updated_at}}
    end
  end

  def find_document(token) when is_binary(token) and byte_size(token) > 0 do
    document =
      from(d in Document,
        join: n in assoc(d, :node),
        join: h in assoc(n, :resource_hub),
        left_join: p in assoc(h, :project),
        left_join: g in assoc(h, :goal),
        join: s in Operately.Groups.Group, on: s.id == coalesce(h.space_id, coalesce(p.group_id, g.group_id)),
        where: d.public_token == ^token and d.state == :published,
        where: is_nil(n.deleted_at) and is_nil(s.deleted_at) and is_nil(p.deleted_at) and is_nil(g.deleted_at)
      )
      |> Repo.one()

    case document do
      nil -> {:error, :not_found}
      document -> {:ok, document}
    end
  end

  def find_document(_), do: {:error, :not_found}

  def url(%Document{public_token: nil}), do: nil
  def url(%Document{public_token: token}), do: OperatelyWeb.Endpoint.url() <> "/public/documents/" <> token

  def public_content(nodes, token) when is_list(nodes), do: Enum.map(nodes, &public_content(&1, token))

  def public_content(%{"type" => "mention", "attrs" => attrs}, _token) do
    %{"type" => "text", "text" => attrs["label"] || "Mentioned person"}
  end

  def public_content(%{"type" => "blob", "attrs" => attrs}, token) do
    id = Operately.RichContent.find_blob_ids(%{"type" => "blob", "attrs" => attrs}) |> List.first()
    public_attrs = Map.take(attrs, ["alt", "title", "filetype", "filesize", "width", "height"])
    src = if id, do: "/public/documents/#{token}/blobs/#{URI.encode_www_form(id)}", else: ""
    %{"type" => "blob", "attrs" => Map.merge(public_attrs, %{"src" => src, "status" => "uploaded"})}
  end

  def public_content(%{"content" => children} = node, token), do: Map.put(node, "content", public_content(children, token))
  def public_content(node, _token), do: node

  defdelegate blob_ids(content), to: Operately.RichContent, as: :find_blob_ids
end
