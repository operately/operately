defmodule Operately.Demo.Company do
  alias Operately.Demo.Resources

  def create_company(resources, account, company_name, title) do
    {:ok, company} = Operately.Operations.CompanyAdding.run(%{
      company_name: company_name,
      title: title,
    }, account)

    owner = Operately.People.get_person!(account, company)

    {:ok, owner} = Operately.People.update_person(owner, %{
      avatar_url: "https://lh3.googleusercontent.com/a/ACg8ocILTOndcnZ-XIGfLdRiI4i6h2QhDVTtaj9XBh3FD_V94g8wLMo=s96-c",
    })

    company_space = Operately.Groups.get_group!(company.company_space_id)

    resources
    |> Resources.add(:company, company)
    |> Resources.add(:company_space, company_space)
    |> Resources.add(:owner, owner)
  end

end
