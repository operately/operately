defmodule OperatelyEE.AdminApi do
  use TurboConnect.Api

  use_types OperatelyEE.AdminApi.Types

  plug OperatelyEE.AdminApi.Plugs.RequireSiteAdmin

  alias OperatelyEE.AdminApi.Queries, as: Q
  alias OperatelyEE.AdminApi.Mutations, as: M

  query :get_companies, Q.GetCompanies
  query :get_active_companies, Q.GetActiveCompanies
  query :get_accounts, Q.GetAccounts
  query :get_company, Q.GetCompany
  query :get_activities, Q.GetActivities
  query :get_email_settings, Q.GetEmailSettings
  query :list_billing_products, Q.ListBillingProducts

  mutation :delete_account, M.DeleteAccount
  mutation :promote_account_to_site_admin, M.PromoteAccountToSiteAdmin
  mutation :demote_account_from_site_admin, M.DemoteAccountFromSiteAdmin
  mutation :enable_feature, M.EnableFeature
  mutation :update_email_settings, M.UpdateEmailSettings
  mutation :send_test_email, M.SendTestEmail
  mutation :create_billing_product, M.CreateBillingProduct
  mutation :update_billing_product, M.UpdateBillingProduct
  mutation :archive_billing_product, M.ArchiveBillingProduct
  mutation :set_active_billing_product, M.SetActiveBillingProduct
  mutation :sync_billing_products_from_polar, M.SyncBillingProductsFromPolar
end
