defimpl OperatelyWeb.Api.Serializable, for: Operately.SiteMessages.SiteMessage do
  def serialize(message, level: :essential) do
    %{
      id: OperatelyWeb.Paths.site_message_id(message),
      title: message.title,
      description: Jason.encode!(message.description),
      inserted_at: message.inserted_at
    }
  end

  def serialize(message, level: :full) do
    %{
      id: OperatelyWeb.Paths.site_message_id(message),
      title: message.title,
      description: Jason.encode!(message.description),
      all_companies: message.all_companies,
      active: message.active,
      expires_at: message.expires_at,
      company_ids: message.company_ids,
      inserted_at: message.inserted_at,
      updated_at: message.updated_at
    }
  end
end
