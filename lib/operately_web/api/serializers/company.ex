defimpl OperatelyWeb.Api.Serializable, for: Operately.Companies.Company do
  def serialize(company, level: :essential) do
    %{
       id: OperatelyWeb.Paths.company_id(company),
       name: company.name,
    }
  end

  def serialize(company, level: :full) do
    %{
      id: OperatelyWeb.Paths.company_id(company),
      name: company.name,
      member_count: company.member_count,
      trusted_email_domains: company.trusted_email_domains,
      enabled_experimental_features: company.enabled_experimental_features,
      company_space_id: company.company_space_id && Operately.ShortUuid.encode!(company.company_space_id),
      people: OperatelyWeb.Api.Serializer.serialize(company.people, level: :full),
      admins: OperatelyWeb.Api.Serializer.serialize(company.admins),
      owners: OperatelyWeb.Api.Serializer.serialize(company.owners),
      permissions: OperatelyWeb.Api.Serializer.serialize(company.permissions)
    }
  end
end
