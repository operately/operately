defimpl OperatelyWeb.Api.Serializable, for: Operately.Comments.InlineAnchor do
  def serialize(anchor, level: _) do
    anchor
    |> Map.take([:source_version, :source_from, :source_to, :quote, :prefix, :suffix, :current_version, :current_from, :current_to])
    |> Map.put(:status, Atom.to_string(anchor.status))
  end
end
