defimpl OperatelyWeb.Api.Serializable, for: Operately.Access.AccessLevels do
  def serialize(data, level: :full) do
    %{
      public: data.public,
      company: data.company,
      space: data.space,
    }
  end
end
