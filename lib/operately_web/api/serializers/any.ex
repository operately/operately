defimpl OperatelyWeb.Api.Serializable, for: Any do
  def serialize(nil, _opts), do: nil
  def serialize(%Ecto.Association.NotLoaded{}, _opts), do: nil
  def serialize(datetime = %NaiveDateTime{}, _opts), do: datetime |> DateTime.from_naive!("Etc/UTC") |> DateTime.to_iso8601()
  def serialize(datetime = %DateTime{}, _opts), do: datetime |> DateTime.to_iso8601()
  def serialize(date = %Date{}, _opts), do: date |> Date.to_iso8601()
  def serialize(atom, _opts) when is_atom(atom), do: Atom.to_string(atom)
  def serialize(string, _opts) when is_binary(string), do: string
end
