defmodule Operately.Comments.InlineAnchor do
  @moduledoc "Versioned reference from an inline thread to a validated rich-text selection."
  use Operately.Schema
  alias Operately.RichContent.Selection

  @primary_key false

  embedded_schema do
    field :source_version, :integer
    field :source_from, :integer
    field :source_to, :integer
    field :quote, :string
    field :prefix, :string
    field :suffix, :string
    field :current_version, :integer
    field :current_from, :integer
    field :current_to, :integer
    field :status, Ecto.Enum, values: [:attached, :unattached]
  end

  def statuses, do: Ecto.Enum.values(__MODULE__, :status)

  def build(content, version, from, to, selected_text) when is_integer(version) and version > 0 do
    with {:ok, %{quote: ^selected_text} = selection} <- Selection.extract(content, {from, to}) do
      {:ok,
       %__MODULE__{
         source_version: version,
         source_from: from,
         source_to: to,
         quote: selection.quote,
         prefix: selection.prefix,
         suffix: selection.suffix,
         current_version: version,
         current_from: from,
         current_to: to,
         status: :attached
       }}
    else
      _ -> {:error, :invalid_anchor}
    end
  end

  def build(_, _, _, _, _), do: {:error, :invalid_anchor}

  def for_version(anchor, version) do
    if anchor.current_version == version and anchor.status == :attached do
      anchor
    else
      %{anchor | status: :unattached, current_from: nil, current_to: nil}
    end
  end
end
